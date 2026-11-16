# Genera el icono provisional de By Heart: public/icono.svg y los PNG de la PWA.
# Uso (Windows, PowerShell 7):  pwsh scripts/generar-iconos.ps1
#
# El dibujo: tres filas de tres casillas (las tres formas de cada verbo) que se van
# rellenando, como la cuadrícula de progreso de la app. La última casilla es un bocadillo con
# "EN": el idioma. Es provisional (SPEC 13, hito 5).
Add-Type -AssemblyName System.Drawing

$fondo = '#f6f4ef'      # --fondo
$llena = '#2f62a8'      # --acento
$vacia = '#d5dbe3'
$burbuja = '#e0a93e'   # ámbar (el de la leyenda del panel)
$textoBurbuja = '#1f2a37'
# Casillas rellenas por fila: 3, 2 y 1.
$rellenas = 3, 2, 1
$publico = Join-Path $PSScriptRoot '..\public'

function Casillas([double]$margen, [double]$hueco) {
  $lado = (512 - 2 * $margen - 2 * $hueco) / 3
  for ($f = 0; $f -lt 3; $f++) {
    for ($c = 0; $c -lt 3; $c++) {
      [pscustomobject]@{
        x = $margen + $c * ($lado + $hueco); y = $margen + $f * ($lado + $hueco); lado = $lado
        color = if ($f -eq 2 -and $c -eq 2) { $burbuja } elseif ($c -lt $rellenas[$f]) { $llena } else { $vacia }
        burbuja = ($f -eq 2 -and $c -eq 2)
      }
    }
  }
}

function Redondeado([double]$x, [double]$y, [double]$ancho, [double]$alto, [double]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  if ($r -le 0) { $p.AddRectangle([System.Drawing.RectangleF]::new($x, $y, $ancho, $alto)); return $p }
  $d = 2 * $r
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $ancho - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $ancho - $d, $y + $alto - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $alto - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function Png([string]$nombre, [int]$tam, [double]$margen, [double]$radioFondo) {
  $e = $tam / 512
  $bmp = New-Object System.Drawing.Bitmap($tam, $tam)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Transparent)
  $pincel = { param($c) New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($c)) }
  $g.FillPath((& $pincel $fondo), (Redondeado 0 0 $tam $tam ($radioFondo * $e)))
  foreach ($k in Casillas $margen 24) {
    if (-not $k.burbuja) {
      $g.FillPath((& $pincel $k.color), (Redondeado ($k.x * $e) ($k.y * $e) ($k.lado * $e) ($k.lado * $e) (20 * $e)))
      continue
    }
    # Bocadillo: casilla algo más baja con un pico abajo a la izquierda, y "EN" dentro.
    $alto = $k.lado * 0.8
    $g.FillPath((& $pincel $k.color), (Redondeado ($k.x * $e) ($k.y * $e) ($k.lado * $e) ($alto * $e) (20 * $e)))
    $pico = [System.Drawing.PointF[]]@(
      [System.Drawing.PointF]::new(($k.x + 16) * $e, ($k.y + $alto - 4) * $e),
      [System.Drawing.PointF]::new(($k.x + 16) * $e, ($k.y + $k.lado) * $e),
      [System.Drawing.PointF]::new(($k.x + 46) * $e, ($k.y + $alto - 4) * $e))
    $g.FillPolygon((& $pincel $k.color), $pico)
    $fuente = New-Object System.Drawing.Font('Arial', [single]($k.lado * 0.4 * $e), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $centro = New-Object System.Drawing.StringFormat
    $centro.Alignment = 'Center'; $centro.LineAlignment = 'Center'
    $g.TextRenderingHint = 'AntiAliasGridFit'
    $g.DrawString('EN', $fuente, (& $pincel $textoBurbuja), [System.Drawing.RectangleF]::new($k.x * $e, $k.y * $e, $k.lado * $e, $alto * $e), $centro)
  }
  $g.Dispose()
  $bmp.Save((Join-Path $publico $nombre), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

# SVG (pestaña del navegador): esquinas redondeadas.
$n = { param($v) ([math]::Round($v, 2)).ToString([cultureinfo]::InvariantCulture) }
$rects = (Casillas 100 24 | ForEach-Object {
  if (-not $_.burbuja) {
    "  <rect x=`"$(& $n $_.x)`" y=`"$(& $n $_.y)`" width=`"$(& $n $_.lado)`" height=`"$(& $n $_.lado)`" rx=`"20`" fill=`"$($_.color)`"/>"
  } else {
    $alto = $_.lado * 0.8
    "  <rect x=`"$(& $n $_.x)`" y=`"$(& $n $_.y)`" width=`"$(& $n $_.lado)`" height=`"$(& $n $alto)`" rx=`"20`" fill=`"$($_.color)`"/>"
    "  <polygon points=`"$(& $n ($_.x + 16)),$(& $n ($_.y + $alto - 4)) $(& $n ($_.x + 16)),$(& $n ($_.y + $_.lado)) $(& $n ($_.x + 46)),$(& $n ($_.y + $alto - 4))`" fill=`"$($_.color)`"/>"
    "  <text x=`"$(& $n ($_.x + $_.lado / 2))`" y=`"$(& $n ($_.y + $alto / 2))`" text-anchor=`"middle`" dominant-baseline=`"central`" font-family=`"Arial, Helvetica, sans-serif`" font-weight=`"700`" font-size=`"$(& $n ($_.lado * 0.4))`" fill=`"$textoBurbuja`">EN</text>"
  }
}) -join "`n"
$svg = "<svg xmlns=`"http://www.w3.org/2000/svg`" viewBox=`"0 0 512 512`">`n  <rect width=`"512`" height=`"512`" rx=`"112`" fill=`"$fondo`"/>`n$rects`n</svg>`n"
[IO.File]::WriteAllText((Join-Path $publico 'icono.svg'), $svg, (New-Object System.Text.UTF8Encoding($false)))

Png 'icono-192.png' 192 100 112
Png 'icono-512.png' 512 100 112
# Maskable y Apple: fondo a sangre (el sistema recorta); el maskable, con más margen.
Png 'icono-maskable-512.png' 512 124 0
Png 'apple-touch-icon.png' 180 100 0
'Iconos generados en public/'
