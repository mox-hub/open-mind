# 裁剪截图并放大: powershell -File crop-zoom.ps1 -In vis-hover.png -Out o.png -X 600 -Y 235 -W 280 -H 120 -Scale 3
param(
  [string]$In,
  [string]$Out,
  [int]$X, [int]$Y, [int]$W, [int]$H,
  [int]$Scale = 1
)
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot $In))
$bw = [int]($W * $Scale); $bh = [int]($H * $Scale)
$bmp = New-Object System.Drawing.Bitmap($bw, $bh)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$srcRect = New-Object System.Drawing.Rectangle($X, $Y, $W, $H)
$dstRect = New-Object System.Drawing.Rectangle(0, 0, $bw, $bh)
$g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$bmp.Save((Join-Path $PSScriptRoot $Out), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $src.Dispose()
Write-Host "saved $Out"
