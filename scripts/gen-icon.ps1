# Generate app-icon.png: brand green rounded square + white lucide "waypoints" glyph (24 viewBox scaled to 512)
# Geometry: rings (12,4) (12,20) (4,12) (20,12) r=2; lines m10.586 5.414 l-5.172 5.172 / m18.586 13.414 l-5.172 5.172 / M6 12 h12
Add-Type -AssemblyName System.Drawing
$size = 512
$scale = 17.5                       # glyph scale (24 viewBox -> ~420px), centered below
$pad = ($size - 24.0 * $scale) / 2

$bmp = [System.Drawing.Bitmap]::new($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

$bg = [System.Drawing.Color]::FromArgb(255, 61, 139, 125)
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

# rounded square background
$bgBrush = [System.Drawing.SolidBrush]::new($bg)
$path = [System.Drawing.Drawing2D.GraphicsPath]::new()
$r = 96
$path.AddArc(0, 0, $r, $r, 180, 90)
$path.AddArc($size - $r, 0, $r, $r, 270, 90)
$path.AddArc($size - $r, $size - $r, $r, $r, 0, 90)
$path.AddArc(0, $size - $r, $r, $r, 90, 90)
$path.CloseFigure()
$g.FillPath($bgBrush, $path)

# glyph
$pen = [System.Drawing.Pen]::new($white, [float](2.0 * $scale))
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

function S([float]$v) { return [float]($v * $scale + $pad) }

$g.DrawLine($pen, (S 10.586), (S 5.414), (S 5.414), (S 10.586))
$g.DrawLine($pen, (S 18.586), (S 13.414), (S 13.414), (S 18.586))
$g.DrawLine($pen, (S 6), (S 12), (S 18), (S 12))

$ringPen = [System.Drawing.Pen]::new($white, [float](2.0 * $scale))
$bgFill = [System.Drawing.SolidBrush]::new($bg)
$circles = @(
    @(12, 4),
    @(12, 20),
    @(4, 12),
    @(20, 12)
)
foreach ($c in $circles) {
    $d = [float](4.0 * $scale)
    $x = (S ($c[0] - 2))
    $y = (S ($c[1] - 2))
    $g.FillEllipse($bgFill, $x, $y, $d, $d)
    $g.DrawEllipse($ringPen, $x, $y, $d, $d)
}

$g.Dispose()
$out = 'D:\workspace\open-mind\app-icon.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "saved: $out"
