using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace MarsApp
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string appUrl = "http://localhost:3000";
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;

            // 1. Check if server is already running
            bool isRunning = IsServerOnline(appUrl);

            Process serverProcess = null;

            if (!isRunning)
            {
                // Start background Node.js server
                string nodePath = FindNodeBinary();
                string serverScript = Path.Combine(baseDir, "node_modules", "next", "dist", "bin", "next");

                if (File.Exists(nodePath) && (File.Exists(serverScript) || Directory.Exists(Path.Combine(baseDir, "src"))))
                {
                    try
                    {
                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = nodePath;
                        psi.Arguments = string.Format("\"{0}\" dev -p 3000", serverScript);
                        psi.WorkingDirectory = baseDir;
                        psi.CreateNoWindow = true;
                        psi.UseShellExecute = false;
                        psi.WindowStyle = ProcessWindowStyle.Hidden;

                        serverProcess = Process.Start(psi);
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Не удалось запустить службу MARS:\n" + ex.Message, "MARS Audio", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    }
                }

                // Wait up to 12 seconds for server to respond
                for (int i = 0; i < 24; i++)
                {
                    Thread.Sleep(500);
                    if (IsServerOnline(appUrl))
                    {
                        isRunning = true;
                        break;
                    }
                }
            }

            // 2. Launch Dedicated Desktop Window
            LaunchDesktopWindow(appUrl);
        }

        static bool IsServerOnline(string url)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Timeout = 1000;
                req.Method = "HEAD";
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK || (int)resp.StatusCode < 400;
                }
            }
            catch
            {
                return false;
            }
        }

        static void LaunchDesktopWindow(string url)
        {
            string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (!File.Exists(edgePath))
            {
                edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            }

            string profileDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MARS", "Profile");

            if (File.Exists(edgePath))
            {
                // Launch Edge in dedicated Frameless / App mode
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = edgePath;
                psi.Arguments = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1360,860", url, profileDir);
                Process.Start(psi);
            }
            else
            {
                // Fallback to default browser
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
        }

        static string FindNodeBinary()
        {
            string localNode = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "node.exe");
            if (File.Exists(localNode)) return localNode;

            string programFilesNode = @"C:\Program Files\nodejs\node.exe";
            if (File.Exists(programFilesNode)) return programFilesNode;

            return "node.exe";
        }
    }
}
