# https://playwright.dev/python/docs/library#pyinstaller

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "[ERROR] Python is not installed or not in PATH. Please install Python first."
    exit 1
}

Write-Host "[SUCCESS] Python detected: $(python --version)"

# Set Playwright browsers installation path (project directory)
$env:PLAYWRIGHT_BROWSERS_PATH = "0"

# Install Chromium (will skip if already installed)
Write-Host "▶ Installing Playwright Chromium..."
playwright install chromium

# Package ws_crawler.py into a single exe, output to bin directory
Write-Host "▶ Starting packaging ws_crawler.py..."
pyinstaller -F scripts\python\ws_crawler.py --workpath temp_build --distpath bin --noconfirm --clean

# Clean up
if (Test-Path build) {
    Remove-Item -Recurse -Force temp_build
    Write-Host "[INFO] temp_build/ folder cleaned up"
}
if (Test-Path ws_crawler.spec) { Remove-Item -Force ws_crawler.spec }

Write-Host "[SUCCESS] Packaging complete. Output file located at bin\ws_crawler.exe"
