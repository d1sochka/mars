; MARS Multi-Platform Music Aggregator Inno Setup Script

#define MyAppName "MARS"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "MARS Audio"
#define MyAppURL "https://mars.audio"
#define MyAppExeName "MARS.exe"

[Setup]
AppId={{5E6A3B9F-3701-499D-B129-C7E41C48B251}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={localappdata}\Programs\{#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=e:\MARS\dist
OutputBaseFilename=MARS_Setup_v1.1.0
SetupIconFile=e:\MARS\build\mars.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Main Executable and Icon
Source: "e:\MARS\build\MARS.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "e:\MARS\build\mars.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "e:\MARS\build\mars.png"; DestDir: "{app}"; Flags: ignoreversion

; Configuration and documentation
Source: "e:\MARS\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "e:\MARS\next.config.mjs"; DestDir: "{app}"; Flags: ignoreversion
Source: "e:\MARS\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "e:\MARS\.env"; DestDir: "{app}"; Flags: ignoreversion onlyifdoesntexist

; Source files
Source: "e:\MARS\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "e:\MARS\src\*"; DestDir: "{app}\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "e:\MARS\electron\*"; DestDir: "{app}\electron"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "e:\MARS\node_modules\electron\dist\*"; DestDir: "{app}\node_modules\electron\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "e:\MARS\prisma\schema.prisma"; DestDir: "{app}\prisma"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\mars.ico"
Name: "{autoprograms}\{#MyAppName}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\mars.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
