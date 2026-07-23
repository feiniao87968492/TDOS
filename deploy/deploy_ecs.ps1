param(
  [string]$HostAlias = "arteta",
  [string]$RemoteDir = "/opt/tdos",
  [string]$PublicBaseUrl = "http://118.178.140.171:1314",
  [switch]$SkipVerify,
  [switch]$SkipAudit,
  [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

$SshExe = Join-Path $env:WINDIR "System32\OpenSSH\ssh.exe"
$ScpExe = Join-Path $env:WINDIR "System32\OpenSSH\scp.exe"
if (-not (Test-Path $SshExe)) { $SshExe = "ssh.exe" }
if (-not (Test-Path $ScpExe)) { $ScpExe = "scp.exe" }

function Assert-LastExit {
  param([string]$Step)
  if ($LASTEXITCODE -ne 0) {
    throw "$Step failed with exit code $LASTEXITCODE"
  }
}

function Run-Native {
  param(
    [string]$Label,
    [string]$File,
    [string[]]$Arguments
  )
  Write-Host ""
  Write-Host "==> $Label"
  & $File @Arguments
  Assert-LastExit $Label
}

if (-not $SkipVerify) {
  Run-Native "npm run test:static-range" "npm" @("run", "test:static-range")
  Run-Native "npm run test:fluid-cover" "npm" @("run", "test:fluid-cover")
  Run-Native "npm run test:fluid-reveal" "npm" @("run", "test:fluid-reveal")
  Run-Native "npm run test:route-fluid" "npm" @("run", "test:route-fluid")
  Run-Native "npm run test:server-bind" "npm" @("run", "test:server-bind")
  Run-Native "npm run test:core" "npm" @("run", "test:core")
  Run-Native "npm run test:2v2-core" "npm" @("run", "test:2v2-core")
  Run-Native "npm run test:2v2-server" "npm" @("run", "test:2v2-server")
  Run-Native "npm run test:2v2-client" "npm" @("run", "test:2v2-client")
  Run-Native "npm run test:2v2-comm" "npm" @("run", "test:2v2-comm")
  Run-Native "npm run test:2v2-reconnect" "npm" @("run", "test:2v2-reconnect")
  Run-Native "npm run test:2v2-browser" "npm" @("run", "test:2v2-browser")
}

if (-not $SkipAudit) {
  Run-Native "npm audit --omit=dev" "npm" @("audit", "--omit=dev", "--registry=https://registry.npmjs.org")
}

if (-not $SkipBuild) {
  Write-Host ""
  Write-Host "==> npm run build"
  $previousBase = $env:VITE_BASE
  try {
    $env:VITE_BASE = "/"
    & npm run build
    Assert-LastExit "npm run build"
  } finally {
    if ($null -eq $previousBase) {
      Remove-Item Env:VITE_BASE -ErrorAction SilentlyContinue
    } else {
      $env:VITE_BASE = $previousBase
    }
  }
}

Run-Native "create remote directory" $SshExe @($HostAlias, "mkdir -p '$RemoteDir'")

Run-Native "upload build and runtime files with scp.exe" $ScpExe @(
  "-r",
  ".\dist",
  ".\package.json",
  ".\package-lock.json",
  ".\serve.cjs",
  ".\server",
  ".\shared",
  ".\scripts",
  "${HostAlias}:$RemoteDir/"
)

$RemoteCommand = @"
set -e
cd '$RemoteDir'
npm ci --omit=dev
chmod -R a+rX '$RemoteDir/dist'
if pm2 describe tdos-ws >/dev/null 2>&1; then
  HOST=127.0.0.1 PORT=21246 NODE_ENV=production pm2 restart tdos-ws --update-env
else
  HOST=127.0.0.1 PORT=21246 NODE_ENV=production pm2 start server/server.js --name tdos-ws --update-env
fi
if pm2 describe tdos-web >/dev/null 2>&1; then
  HOST=127.0.0.1 PORT=21245 WEB_ROOT='$RemoteDir/dist' NODE_ENV=production pm2 restart tdos-web --update-env
else
  HOST=127.0.0.1 PORT=21245 WEB_ROOT='$RemoteDir/dist' NODE_ENV=production pm2 start serve.cjs --name tdos-web --update-env
fi
pm2 save
pm2 status --no-color
"@

Run-Native "install dependencies and restart pm2 services" $SshExe @($HostAlias, $RemoteCommand)

Run-Native "check public homepage 118.178.140.171:1314" "curl.exe" @("-fsSI", $PublicBaseUrl)

Write-Host ""
Write-Host "==> check cover video byte range"
$rangeHeaders = & curl.exe -fsSI -H "Range: bytes=0-1023" "$PublicBaseUrl/assets/fluid-reveal/petal_20241215_012801.mp4"
Assert-LastExit "cover video byte range check"
$rangeHeaders | Out-Host
if (($rangeHeaders -join "`n") -notmatch "206 Partial Content") {
  throw "Cover video byte range check did not return 206 Partial Content"
}

Write-Host ""
Write-Host "Deployment complete: $PublicBaseUrl"
