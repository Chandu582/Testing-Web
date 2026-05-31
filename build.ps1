# BookOTS PowerShell Automated Compilation and Obfuscation Pipeline
# Designed & Developed by Xevion Byte (https://xevion-byte.vercel.app / 9693776982)

Write-Host "🚀 Starting BookOTS Native Compilation Pipeline (PowerShell Edition)..." -ForegroundColor Yellow

$srcDir = Join-Path $PSScriptRoot "src"
$distDir = Join-Path $PSScriptRoot "dist"

# 1. Ensure Directories Exist
$dirs = @(
    $distDir,
    (Join-Path $distDir "assets"),
    (Join-Path $distDir "assets\css"),
    (Join-Path $distDir "assets\js")
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Helper: Minify CSS Content
function Minify-CSS ($css) {
    # Remove block comments
    $css = [regex]::Replace($css, "/\*[\s\S]*?\*/", "")
    # Remove extra spaces
    $css = [regex]::Replace($css, "\s+", " ")
    $css = [regex]::Replace($css, "\s*([\{\}:;,])\s*", '$1')
    return $css.Trim()
}

# Helper: Minify JS Content
function Minify-JS ($js) {
    # Remove block comments
    $js = [regex]::Replace($js, "/\*[\s\S]*?\*/", "")
    # Remove single line comments carefully (avoiding https://)
    $js = [regex]::Replace($js, "(?<!https?:)//.*", "")
    # Remove duplicate spaces and newlines
    $js = [regex]::Replace($js, "\s+", " ")
    return $js.Trim()
}

# Helper: Obfuscate code to Base64
function Obfuscate-Code ($code) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($code)
    $base64 = [Convert]::ToBase64String($bytes)
    return "eval(atob('$base64'));"
}

# Helper: Minify HTML Content
function Minify-HTML ($html) {
    # Replace asset paths
    $html = $html.Replace("assets/css/style.css", "assets/css/style.min.css")
    $html = $html.Replace("assets/js/db.js", "assets/js/db.min.js")
    $html = $html.Replace("assets/js/app.js", "assets/js/app.min.js")
    $html = $html.Replace("assets/js/admin.js", "assets/js/admin.min.js")
    
    # Strip HTML comments
    $html = [regex]::Replace($html, "<!--[\s\S]*?-->", "")
    # Collapse whitespaces
    $html = [regex]::Replace($html, "\s+", " ")
    return $html.Trim()
}

# --- PROCESS STYLE SHEET ---
Write-Host "🎨 Minifying Style Sheet style.css..." -ForegroundColor Cyan
$rawCss = Get-Content (Join-Path $srcDir "assets\css\style.css") -Raw
$minCss = Minify-CSS $rawCss
Set-Content (Join-Path $distDir "assets\css\style.min.css") $minCss
Write-Host "✅ style.min.css generated successfully! ($($rawCss.Length) bytes -> $($minCss.Length) bytes)" -ForegroundColor Green

# --- PROCESS APP.JS ---
Write-Host "⚡ Compiling & Obfuscating app.js..." -ForegroundColor Cyan
$rawApp = Get-Content (Join-Path $srcDir "assets\js\app.js") -Raw
$minApp = Minify-JS $rawApp
$obfApp = Obfuscate-Code $minApp
Set-Content (Join-Path $distDir "assets\js\app.min.js") $obfApp
Write-Host "✅ app.min.js compiled! ($($rawApp.Length) bytes -> $($obfApp.Length) bytes)" -ForegroundColor Green

# --- PROCESS ADMIN.JS ---
Write-Host "⚡ Compiling & Obfuscating admin.js..." -ForegroundColor Cyan
$rawAdmin = Get-Content (Join-Path $srcDir "assets\js\admin.js") -Raw
$minAdmin = Minify-JS $rawAdmin
$obfAdmin = Obfuscate-Code $minAdmin
Set-Content (Join-Path $distDir "assets\js\admin.min.js") $obfAdmin
Write-Host "✅ admin.min.js compiled! ($($rawAdmin.Length) bytes -> $($obfAdmin.Length) bytes)" -ForegroundColor Green

# --- PROCESS DB.JS (Requires Module-Safe Export) ---
Write-Host "⚡ Compiling & Obfuscating db.js..." -ForegroundColor Cyan
$rawDb = Get-Content (Join-Path $srcDir "assets\js\db.js") -Raw

# Replace top-level export with standard assignment to allow static export at bottom
$modifiedDb = $rawDb.Replace("export const db = new DBManager();", "db = new DBManager();")
$minDb = Minify-JS $modifiedDb
$base64Db = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($minDb))

$finalDbCode = "let db;eval(atob('$base64Db'));export{db};"
Set-Content (Join-Path $distDir "assets\js\db.min.js") $finalDbCode
Write-Host "✅ db.min.js compiled and module-exported! ($($rawDb.Length) bytes -> $($finalDbCode.Length) bytes)" -ForegroundColor Green

# --- PROCESS HTML FILES ---
$htmlFiles = @("index.html", "admin.html")
foreach ($file in $htmlFiles) {
    Write-Host "📄 Minifying HTML file $file..." -ForegroundColor Cyan
    $rawHtml = Get-Content (Join-Path $srcDir $file) -Raw
    $minHtml = Minify-HTML $rawHtml
    Set-Content (Join-Path $distDir $file) $minHtml
    Write-Host "✅ $file minified! ($($rawHtml.Length) bytes -> $($minHtml.Length) bytes)" -ForegroundColor Green
}

Write-Host "`n✨ Premium Production Build Completed Natively! ✨" -ForegroundColor Yellow
Write-Host "📂 Output folder: \dist\" -ForegroundColor Green
Write-Host "💼 Designed & Developed by Xevion Byte" -ForegroundColor Yellow
