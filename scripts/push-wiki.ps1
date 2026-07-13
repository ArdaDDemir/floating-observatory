# Push wiki/ folder to GitHub Wiki
# Prerequisite (once): open
#   https://github.com/ArdaDDemir/floating-observatory/wiki
# click "Create the first page", save a blank Home, then re-run this script.
#
# Usage:  pwsh scripts/push-wiki.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root "wiki"
$tmp = Join-Path $env:TEMP "floating-observatory.wiki-push"
$token = (gh auth token)

if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }

Write-Host "Cloning wiki remote..."
git clone "https://x-access-token:$token@github.com/ArdaDDemir/floating-observatory.wiki.git" $tmp
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Wiki git remote not found yet."
  Write-Host "1) Open https://github.com/ArdaDDemir/floating-observatory/wiki"
  Write-Host "2) Click Create the first page, title: Home, save"
  Write-Host "3) Re-run: pwsh scripts/push-wiki.ps1"
  exit 1
}

Copy-Item -Force (Join-Path $src "*.md") $tmp
Set-Location $tmp
git add .
git status
git commit -m "docs: sync project wiki" 2>$null
git push origin HEAD:master
if ($LASTEXITCODE -ne 0) { git push origin HEAD:main }
Write-Host "Wiki published."
