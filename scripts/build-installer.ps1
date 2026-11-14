# MARS Windows Installer Build Script
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   MARS Windows Installer Builder     " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$baseDir = Split-Path -Parent $PSScriptRoot

# 1. Generate Icons
Write-Host "[1/3] Generating application icons..." -ForegroundColor Yellow
& powershell -ExecutionPolicy Bypass -File "$baseDir\scripts\generate-icon.ps1"

# 2. Compile native C# MARS.exe launcher
Write-Host "[2/3] Compiling native MARS.exe launcher..." -ForegroundColor Yellow
$cscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
& $cscPath /target:winexe /out:"$baseDir\build\MARS.exe" /win32icon:"$baseDir\build\mars.ico" /r:System.Windows.Forms.dll,System.Drawing.dll,System.dll "$baseDir\src-desktop\Program.cs"

# 3. Compile Inno Setup Installer
Write-Host "[3/3] Compiling Inno Setup package..." -ForegroundColor Yellow
$isccPath = "C:\Users\disa\AppData\Local\Programs\Inno Setup 6\ISCC.exe"
if (!(Test-Path $isccPath)) {
    $isccPath = "ISCC.exe"
}

New-Item -ItemType Directory -Path "$baseDir\dist" -Force | Out-Null
& $isccPath "$baseDir\installer.iss"

Write-Host ""
Write-Host "SUCCESS! Installer created at:" -ForegroundColor Green
Write-Host "$baseDir\dist\MARS_Setup_v1.1.0.exe" -ForegroundColor White
