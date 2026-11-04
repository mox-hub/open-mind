# OpenMind 视觉验证辅助：按标题定位窗口 -> 置前 -> 真实鼠标移动/点击(窗口客户区偏移) -> 截图
# 用法: powershell -File ui-probe.ps1 -X 200 -Y 60 -Click -Out vis-shot.png
param(
  [int]$X = 200,
  [int]$Y = 60,
  [switch]$Click,
  [string]$Out = 'vis-probe.png',
  [int]$SleepMs = 800,
  [int]$MoveX = -1,
  [int]$MoveY = -1,
  [int]$RightClick = 0,
  [string]$Keys = ''
)
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class OMWin {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, UIntPtr e);
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr h, int x, int y, int w, int hh, bool repaint);
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
  public struct RECT { public int L; public int T; public int R; public int B; }
}
"@

$proc = Get-Process chrome -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowTitle -like 'OpenMind 思维导图*' } | Select-Object -First 1
if (-not $proc) {
  $proc = Get-Process | Where-Object { $_.MainWindowTitle -like 'OpenMind 思维导图*' } | Select-Object -First 1
}
if (-not $proc) { Write-Host 'window not found'; exit 1 }

$h = $proc.MainWindowHandle
if ($MoveX -ge 0) {
  [OMWin]::MoveWindow($h, $MoveX, $MoveY, 1560, 1000, $true) | Out-Null
}
# ALT 抖动解锁 SetForegroundWindow（前台锁限制下直接调用会被静默拒绝）
[OMWin]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero)
[OMWin]::SetForegroundWindow($h) | Out-Null
[OMWin]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 400

$r = New-Object OMWin+RECT
[OMWin]::GetWindowRect($h, [ref]$r) | Out-Null
$px = $r.L + $X
$py = $r.T + $Y
[OMWin]::SetCursorPos($px, $py) | Out-Null
Start-Sleep -Milliseconds 200

if ($RightClick -gt 0) {
  [OMWin]::mouse_event(8, 0, 0, 0, [UIntPtr]::Zero)
  Start-Sleep -Milliseconds 60
  [OMWin]::mouse_event(16, 0, 0, 0, [UIntPtr]::Zero)
} elseif ($Click) {
  [OMWin]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
  Start-Sleep -Milliseconds 60
  [OMWin]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
}
Start-Sleep -Milliseconds 200

if ($Keys -ne '') {
  [System.Windows.Forms.SendKeys]::SendWait($Keys)
}
Start-Sleep -Milliseconds $SleepMs

$outPath = Join-Path $PSScriptRoot $Out
$b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap($b.Width, $b.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "window rect: $($r.L),$($r.T) - $($r.R),$($r.B); cursor: $px,$py; saved: $outPath"
