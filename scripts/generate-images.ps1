# Generates the Pulse brand images for SEO / social / PWA into public/:
#   og-image.png (1200x630 social card), apple-touch-icon.png (180),
#   icon-192.png, icon-512.png.
# Run from anywhere:  powershell -File scripts/generate-images.ps1
Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot "..\public"
New-Item -ItemType Directory -Force $out | Out-Null

$ink   = [System.Drawing.Color]::FromArgb(255, 10, 11, 9)
$coal  = [System.Drawing.Color]::FromArgb(255, 18, 20, 14)
$soot  = [System.Drawing.Color]::FromArgb(255, 26, 29, 19)
$line  = [System.Drawing.Color]::FromArgb(255, 38, 42, 28)
$paper = [System.Drawing.Color]::FromArgb(255, 242, 243, 236)
$mute  = [System.Drawing.Color]::FromArgb(255, 143, 148, 132)
$acid  = [System.Drawing.Color]::FromArgb(255, 215, 255, 60)

function New-Font([single]$size, [switch]$bold) {
  $style = if ($bold) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
  return New-Object System.Drawing.Font("Segoe UI", $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}
function B([System.Drawing.Color]$c) { return New-Object System.Drawing.SolidBrush($c) }
function P([System.Drawing.Color]$c, [single]$w) { return New-Object System.Drawing.Pen($c, $w) }

function Fit-Text($g, [string]$text, [single]$size, [single]$maxWidth) {
  while ($size -gt 12) {
    $f = New-Font $size -bold
    $w = $g.MeasureString($text, $f).Width
    $f.Dispose()
    if ($w -le $maxWidth) { return $size }
    $size -= 2
  }
  return $size
}

function Draw-Icon([int]$size, [string]$file) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear($ink)
  $tick = [single]($size * 0.045)
  $g.DrawLine((P $acid $tick), [single]($size * 0.5), [single]($size * 0.14), [single]($size * 0.5), [single]($size * 0.30))
  $g.DrawLine((P $acid $tick), [single]($size * 0.5), [single]($size * 0.70), [single]($size * 0.5), [single]($size * 0.86))
  $g.DrawLine((P $acid $tick), [single]($size * 0.14), [single]($size * 0.5), [single]($size * 0.30), [single]($size * 0.5))
  $g.DrawLine((P $acid $tick), [single]($size * 0.70), [single]($size * 0.5), [single]($size * 0.86), [single]($size * 0.5))
  $r = [single]($size * 0.17)
  $g.FillEllipse((B $acid), [single]($size * 0.5 - $r), [single]($size * 0.5 - $r), $r * 2, $r * 2)
  $g.Dispose()
  $bmp.Save((Join-Path $out $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

# --- social card (1200 x 630) ---
$w = 1200; $h = 630; $m = 64
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear($ink)

# wordmark + acid dot
$f = New-Font 46 -bold
$g.DrawString("Pulse", $f, (B $paper), $m, 52)
$dotX = $m + $g.MeasureString("Pulse", $f).Width + 16
$g.FillEllipse((B $acid), $dotX, 74, 14, 14)

# headline (auto-fit to the left column, which ends before the mock card at x=740)
$maxW = 640
$s1 = Fit-Text $g "Post everywhere." 84 $maxW
$f1 = New-Font $s1 -bold
$g.DrawString("Post everywhere.", $f1, (B $paper), $m, 176)
$s2 = Fit-Text $g "Once." 84 $maxW
$f2 = New-Font $s2 -bold
$g.DrawString("Once.", $f2, (B $acid), $m, 292)

# sub
$f3 = New-Font 30
$g.DrawString("AI-powered social media automation", $f3, (B $mute), $m, 428)

# platforms row
$f4 = New-Font 17
$g.DrawString("INSTAGRAM   |   TIKTOK   |   X   |   LINKEDIN   |   YOUTUBE   |   FACEBOOK   |   THREADS", $f4, (B $mute), $m, 552)

# dashboard mock card (right)
$cx = 748; $cy = 130; $cw = 388; $ch = 372
$g.FillRectangle((B $coal), $cx, $cy, $cw, $ch)
$g.DrawRectangle((P $line 2), $cx, $cy, $cw, $ch)
$f5 = New-Font 17
$g.DrawString("Engagement - last 30 days", $f5, (B $paper), ($cx + 24), ($cy + 26))
$f6 = New-Font 15 -bold
$g.DrawString("+12.4%", $f6, (B $acid), ($cx + $cw - 92), ($cy + 28))
$g.DrawLine((P $line 1), ($cx + 24), ($cy + 66), ($cx + $cw - 24), ($cy + 66))

# bars
$heights = @(96, 136, 116, 196, 160, 236, 208)
$bw = 34; $gap = 14; $base = $cy + $ch - 28
for ($i = 0; $i -lt $heights.Count; $i++) {
  $bx = $cx + 24 + $i * ($bw + $gap)
  $bh = $heights[$i]
  $barBrush = if ($i -eq $heights.Count - 2) { B $acid } else { B $soot }
  $g.FillRectangle($barBrush, $bx, $base - $bh, $bw, $bh)
  $g.DrawRectangle((P $line 1), $bx, $base - $bh, $bw, $bh)
}
$f7 = New-Font 14
$g.DrawString("posts scheduled · AI captions · best-time slots", $f7, (B $mute), ($cx + 24), ($cy + $ch - 22))

$g.Dispose()
$bmp.Save((Join-Path $out "og-image.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Draw-Icon 180 "apple-touch-icon.png"
Draw-Icon 192 "icon-192.png"
Draw-Icon 512 "icon-512.png"

Get-ChildItem $out -Filter *.png | ForEach-Object { "{0}  {1:N0} KB" -f $_.Name, ($_.Length / 1KB) }
