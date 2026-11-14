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

            if (!isRunning)
            {
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

                        Process.Start(psi);
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

            // 2. Launch Dedicated Native Desktop Application Window via Electron
            LaunchNativeElectronWindow(baseDir, appUrl);
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

        static void LaunchNativeElectronWindow(string baseDir, string url)
        {
            string electronExe = Path.Combine(baseDir, "node_modules", "electron", "dist", "electron.exe");
            string mainScript = Path.Combine(baseDir, "electron", "main.js");

            if (File.Exists(electronExe) && File.Exists(mainScript))
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = electronExe;
                psi.Arguments = string.Format("\"{0}\"", mainScript);
                psi.WorkingDirectory = baseDir;
                psi.UseShellExecute = false;
                Process.Start(psi);
                return;
            }

            // Fallback to Edge in App mode if Electron binary is missing
            string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (!File.Exists(edgePath))
            {
                edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            }

            string profileDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MARS", "Profile");

            if (File.Exists(edgePath))
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = edgePath;
                psi.Arguments = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1360,860", url, profileDir);
                Process.Start(psi);
            }
            else
            {
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
