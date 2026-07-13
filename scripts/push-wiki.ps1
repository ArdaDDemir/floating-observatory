# Push wiki/ folder to GitHub Wiki
# Prerequisite (once): open
#   https://github.com/ArdaDDemir/floating-observatory/wiki
# click "Create the first page", title Home, save — then re-run.
#
# Usage:  powershell -File scripts/push-wiki.ps1
#    or:  npm run wiki:push

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root "wiki"
$tmp = Join-Path $env:TEMP "floating-observatory.wiki-push"

function Get-GhToken {
  $t = & gh auth token 2>$null
  if (-not $t) { throw "gh auth token failed — run: gh auth login" }
  return $t.Trim()
}

$token = Get-GhToken
$remote = "https://x-access-token:${token}@github.com/ArdaDDemir/floating-observatory.wiki.git"

if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }

Write-Host "Checking wiki remote..."
$probe = & git ls-remote $remote HEAD 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Wiki git remote not found yet (normal on first run)."
  Write-Host "1) Open https://github.com/ArdaDDemir/floating-observatory/wiki"
  Write-Host "2) Click Create the first page — title: Home — Create page"
  Write-Host "3) Re-run: npm run wiki:push"
  exit 1
}

Write-Host "Cloning wiki..."
& git clone $remote $tmp
if ($LASTEXITCODE -ne 0) { throw "git clone wiki failed" }

Copy-Item -Force (Join-Path $src "*.md") $tmp
Push-Location $tmp
try {
  & git config user.name "ArdaDDemir"
  & git config user.email "iletisim@ardademir.com.tr"
  & git add .
  $status = & git status --porcelain
  if (-not $status) {
    Write-Host "Wiki already up to date."
    exit 0
  }
  & git commit -m "docs: sync project wiki"
  & git push origin HEAD:master
  if ($LASTEXITCODE -ne 0) {
    & git push origin HEAD:main
  }
  if ($LASTEXITCODE -ne 0) { throw "git push wiki failed" }
  Write-Host "Wiki published: https://github.com/ArdaDDemir/floating-observatory/wiki"
}
finally {
  Pop-Location
}
