$portable = "$env:USERPROFILE\tools\node-portable"
if (-not (Test-Path $portable)) {
  Write-Error "Portable Node not found at $portable"
  exit 1
}

$env:Path = "$portable;$env:Path"
node -v
npm -v
Write-Output "Portable Node activated for this terminal session."
