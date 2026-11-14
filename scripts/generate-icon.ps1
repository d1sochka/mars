Add-Type -AssemblyName System.Drawing

$outputDir = "e:\MARS\build"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$iconPath = Join-Path $outputDir "mars.ico"
$pngPath = Join-Path $outputDir "mars.png"

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Clear with transparent
$g.Clear([System.Drawing.Color]::Transparent)

# Outer circle gradient (Mars Red / Cosmic Orange)
$rect = New-Object System.Drawing.Rectangle(8, 8, ($size - 16), ($size - 16))
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 255, 56, 35),
    [System.Drawing.Color]::FromArgb(255, 255, 120, 40),
    45.0
)
$g.FillEllipse($brush, $rect)

# Inner cosmic circle
$innerRect = New-Object System.Drawing.Rectangle(24, 24, ($size - 48), ($size - 48))
$darkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 14, 16, 24))
$g.FillEllipse($darkBrush, $innerRect)

# Letter "M" in the center
$fontFamily = New-Object System.Drawing.FontFamily("Arial")
$font = New-Object System.Drawing.Font($fontFamily, 110, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$textBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $innerRect,
    [System.Drawing.Color]::White,
    [System.Drawing.Color]::FromArgb(255, 255, 200, 180),
    90.0
)

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$textRect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
$g.DrawString("M", $font, $textBrush, $textRect, $sf)

# Save PNG
$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Convert Bitmap to Icon
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream($iconPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$g.Dispose()
$bmp.Dispose()

Write-Output "Generated icon at $iconPath and $pngPath"
