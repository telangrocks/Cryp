# Requires PowerShell 7+ (pwsh) and Windows with winget available
[CmdletBinding()]
param(
  [string]$WorkspaceRoot = "C:\\CryptoPulse\\Cryp\\Cryptopulse--main",
  [string]$FrontendDir   = "C:\\CryptoPulse\\Cryp\\Cryptopulse--main\\frontend",
  [string]$BackendDir    = "C:\\CryptoPulse\\Cryp\\Cryptopulse--main\\backend",
  [int]$EdgeDebugPort    = 9222,
  # Default to live Frontend URL; override as needed with parameter
  [string]$FrontendUrl   = "https://cryptopulse-frontend.onrender.com",
  [switch]$RenderDeploy,
  [int]$MaxStabilityChecks = 5,
  [int]$CheckIntervalSeconds = 8,
  [int]$MaxAutoFixAttempts = 3,
  # Default to live Backend health; override as needed
  [string]$BackendHealthUrl = "https://cryptopulse-backend-j4ne.onrender.com/health",
  # Default cloud checks (add more with parameter)
  [string[]]$CloudHealthUrls = @("https://cryptopulse-cloud-functions.onrender.com"),
  # Optional credentials and API keys
  [string]$FirebaseCredentialsJson = $null,
  [string]$RenderApiKey = $null,
  [string]$RenderServiceId = $null
  ,[switch]$NoAdmin
)

function Assert-Elevation {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object Security.Principal.WindowsPrincipal($id)
  if (-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Please run this script in an elevated PowerShell (Run as Administrator)."
    exit 1
  }
}

function Test-Command { param([string]$Name) Get-Command $Name -ErrorAction SilentlyContinue | ForEach-Object { $true } }

function Install-Winget { 
  if (-not (Test-Command winget)) {
    Write-Error "winget is not available. Install Microsoft Store App Installer, then re-run."
    exit 1
  }
}

function Ensure-Package {
  param([string]$Id, [string]$CheckCmd = $null)
  if ($CheckCmd -and (Test-Command $CheckCmd)) { Write-Host "$Id already installed."; return }
  Write-Host "Installing $Id..."
  winget install --id $Id -e --silent --accept-package-agreements --accept-source-agreements | Out-Null
}

function Ensure-NodeAndPNPM {
  if (-not (Test-Command node)) {
    Write-Host "Installing Node.js LTS..."
    winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Null
  } else {
    Write-Host "Node.js present: $(node -v)"
  }
  if (-not (Test-Command pnpm)) {
    Write-Host "Installing pnpm..."
    $pnpmInstalled = $false
    try {
      winget install -e --id pnpm.pnpm --silent --accept-package-agreements --accept-source-agreements | Out-Null
      $pnpmInstalled = $true
    } catch { }
    if (-not $pnpmInstalled) {
      corepack enable 2>$null
      corepack prepare pnpm@latest --activate 2>$null
    }
  } else {
    Write-Host "pnpm present: $(pnpm -v)"
  }
}

function Get-CodeCmd {
  $codeCmd = "code"
  if (Test-Command $codeCmd) { return $codeCmd }
  $fallback = Join-Path $env:LOCALAPPDATA "Programs\Microsoft VS Code\bin\code.cmd"
  if (Test-Path $fallback) { return $fallback }
  return $null
}

function Ensure-VSCode-Extensions {
  $codeCmd = Get-CodeCmd
  if (-not $codeCmd) {
    Write-Warning "VS Code CLI not on PATH yet. You might need to open a new terminal for 'code' to work."
    return
  }
  $extensions = @(
    "ms-edgedevtools.vscode-edge-devtools",
    "ms-vscode.js-debug-nightly",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  )
  foreach ($ext in $extensions) {
    Write-Host "Ensuring VS Code extension: $ext"
    & $codeCmd --install-extension $ext --force | Out-Null
  }
}

function Wait-ForHttp {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [int]$TimeoutSeconds = 300,
    [int]$IntervalSeconds = 3
  )
  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    try {
      $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -Method Get
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { return $true }
    } catch { }
    Start-Sleep -Seconds $IntervalSeconds
  }
  return $false
}

function Start-ProcessDetached {
  param([string]$FilePath, [string]$Args = "", [string]$WorkingDir = $null)
  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName        = $FilePath
  $psi.Arguments       = $Args
  if ($WorkingDir) { $psi.WorkingDirectory = $WorkingDir }
  $psi.UseShellExecute = $true
  $psi.WindowStyle     = [System.Diagnostics.ProcessWindowStyle]::Normal
  [System.Diagnostics.Process]::Start($psi) | Out-Null
}

function Start-PwshTask {
  param([string]$Title, [string]$WorkingDir, [string]$Script)
  Write-Host "Starting $Title in new pwsh window..."
  $startupScript = @(
    "if (Test-Path package.json) {",
    "  if (Test-Path pnpm-lock.yaml) { pnpm i; pnpm run dev }",
    "  elseif (Test-Path package-lock.json) { npm i; npm run dev }",
    "  else { npm i; npm run dev }",
    "} else {",
    "  Write-Host 'No package.json found in $WorkingDir'",
    "}"
  ) -join '; '
  $innerCommand = "& { Set-Location `"$WorkingDir`"; $startupScript }"
  $cmd = "pwsh -NoLogo -NoExit -Command `"$innerCommand`""
  if (Test-Command wt) {
    Start-ProcessDetached "wt.exe" "-w 0 nt -p `\"PowerShell`\" $Title; sp -p `\"PowerShell`\" $Title $cmd"
  } else {
    Start-ProcessDetached "pwsh.exe" "-NoLogo -NoExit -Command `"$innerCommand`""
  }
}

function Start-DevProcess {
  param(
    [Parameter(Mandatory=$true)][string]$WorkingDir,
    [Parameter(Mandatory=$true)][string]$CommandLine,
    [Parameter(Mandatory=$true)][string]$LogFile
  )
  if (-not (Test-Path (Split-Path $LogFile -Parent))) {
    New-Item -ItemType Directory -Force -Path (Split-Path $LogFile -Parent) | Out-Null
  }
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "pwsh.exe"
  $devInner = "& { Set-Location `"$WorkingDir`"; $CommandLine }"
  $psi.Arguments = "-NoLogo -NoProfile -Command `"$devInner`""
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError  = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $proc = New-Object System.Diagnostics.Process
  $proc.StartInfo = $psi
  $null = $proc.Start()
  # Async log capture
  $stdoutWriter = [System.IO.StreamWriter]::new($LogFile, $true)
  $stderrWriter = [System.IO.StreamWriter]::new($LogFile, $true)
  $proc.BeginOutputReadLine()
  $proc.BeginErrorReadLine()
  $proc.add_OutputDataReceived({ param($s,$e) if ($e.Data) { $stdoutWriter.WriteLine($e.Data) ; $stdoutWriter.Flush() } })
  $proc.add_ErrorDataReceived({ param($s,$e) if ($e.Data) { $stderrWriter.WriteLine($e.Data) ; $stderrWriter.Flush() } })
  return $proc
}

function Test-LogsForErrors {
  param([string]$LogFile)
  if (-not (Test-Path $LogFile)) { return $false }
  $content = Get-Content -Path $LogFile -Raw -ErrorAction SilentlyContinue
  if (-not $content) { return $false }
  $patterns = @(
    'ERROR','Unhandled','Exception','reject(ed|ion)','stack trace','TypeError','ReferenceError','SyntaxError',
    'Module build failed','Failed to compile','build failed','fatal','ELIFECYCLE','ERR_MODULE_NOT_FOUND','Cannot find module',
    'dependency problem','npm ERR!','pnpm ERR!','yarn ERR!','ECONNREFUSED','EAI_AGAIN','EADDRINUSE','ETIMEDOUT','ENOTFOUND',
    'API error','Unauthorized','Forbidden','Rate limit','network error','fetch failed','CORS error','WebSocket error'
  )
  foreach ($p in $patterns) { if ($content -match $p) { return $true } }
  return $false
}

function Try-AutoFixIssue {
  param([string]$ProjectDir)
  Write-Host "Attempting automated fixes in $ProjectDir..."
  try {
    Push-Location $ProjectDir
    if (Test-Path package.json) {
      if (Test-Path pnpm-lock.yaml) { pnpm install } elseif (Test-Path package-lock.json) { npm install } else { npm install }
      # Run common autofixers if available
      if (Test-Path .eslintrc* -or (Get-Content package.json -Raw) -match 'eslint') { try { npx eslint . --ext .js,.ts,.tsx --fix } catch { } }
      if ((Get-Content package.json -Raw) -match 'prettier') { try { npx prettier -w . } catch { } }
      # Attempt typecheck/build to surface issues
      try { if ((Get-Content package.json -Raw) -match 'typecheck') { npm run typecheck } } catch { }
      try { if ((Get-Content package.json -Raw) -match 'build') { npm run build } } catch { }
    }
  } finally { Pop-Location }
}

function Git-CommitPush {
  param([string]$RepoRoot,[string]$Message)
  try {
    Push-Location $RepoRoot
    if (-not (Test-Path .git)) { return }
    $status = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($status)) { return }
    git add -A
    git commit -m $Message | Out-Null
    try { git pull --rebase | Out-Null } catch { }
    try { git push | Out-Null } catch { }
  } catch {}
  finally { Pop-Location }
}

function Get-GitBashPath {
  $candidates = @(
    "$env:ProgramFiles\Git\bin\bash.exe",
    "$env:ProgramFiles(x86)\Git\bin\bash.exe"
  )
  foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
  return $null
}

function Deploy-ToRender {
  param([string]$RepoRoot)
  $bash = Get-GitBashPath
  if (-not $bash) { Write-Warning "Git Bash not found. Install Git for Windows to enable Render deployment."; return $null }
  $script = Join-Path $RepoRoot "scripts/render-deploy.sh"
  if (-not (Test-Path $script)) { Write-Warning "Render deploy script not found at $script"; return $null }
  Write-Host "Starting Render deployment via Bash script..."
  $outFile = Join-Path $RepoRoot "deploy.out.txt"
  $errFile = Join-Path $RepoRoot "deploy.err.txt"
  $envArgs = @()
  if ($env:RENDER_API_KEY) { $envArgs += "export RENDER_API_KEY='$env:RENDER_API_KEY';" }
  if ($env:RENDER_SERVICE_ID) { $envArgs += "export RENDER_SERVICE_ID='$env:RENDER_SERVICE_ID';" }
  $cmd = ("{0} bash `"{1}`"" -f ($envArgs -join ' '), $script)
  $proc = Start-Process -FilePath $bash -ArgumentList "-lc",$cmd -PassThru -NoNewWindow -RedirectStandardOutput $outFile -RedirectStandardError $errFile
  $proc.WaitForExit()
  $out = Get-Content $outFile -Raw -ErrorAction SilentlyContinue
  $err = Get-Content $errFile -Raw -ErrorAction SilentlyContinue
  $urls = [regex]::Matches($out, 'https?:\\/\\/[a-z0-9-]+\.onrender\.com') | ForEach-Object { $_.Value } | Select-Object -Unique
  if ($urls.Count -gt 0) { Write-Host "Render URLs detected:"; $urls | ForEach-Object { Write-Host " - $_" } }
  return @{ urls = $urls; stdout = $out; stderr = $err }
}

function Test-Health {
  param([string]$Url,[int]$TimeoutSeconds = 10)
  try {
    $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds -Method Get
    return ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500)
  } catch { return $false }
}

# 1) Pre-flight
if (-not $NoAdmin) { Assert-Elevation }
Install-Winget

# 2) Ensure core tools
Ensure-Package -Id "Git.Git" -CheckCmd git
Ensure-Package -Id "Microsoft.VisualStudioCode" -CheckCmd code
Ensure-Package -Id "Microsoft.Edge" -CheckCmd msedge
Ensure-Package -Id "Cursor.Cursor" -CheckCmd cursor
Ensure-NodeAndPNPM

# Export optional credentials for downstream processes
if ($FirebaseCredentialsJson) {
  if (Test-Path $FirebaseCredentialsJson) {
    $env:FIREBASE_CREDENTIALS_JSON = $FirebaseCredentialsJson
    Write-Host "Firebase credentials set in environment."
  } else {
    Write-Warning "Firebase credentials file not found at $FirebaseCredentialsJson"
  }
}
if ($RenderApiKey) {
  $env:RENDER_API_KEY = $RenderApiKey
}
if ($RenderServiceId) {
  $env:RENDER_SERVICE_ID = $RenderServiceId
}

# 3) Ensure VS Code extensions
Ensure-VSCode-Extensions

# 4) Start backend/frontend dev servers
if (Test-Path $BackendDir) { Start-PwshTask -Title "Backend" -WorkingDir $BackendDir -Script "if (Test-Path pnpm-lock.yaml) { pnpm i; pnpm run dev } else { npm i; npm run dev }" }
if (Test-Path $FrontendDir) { Start-PwshTask -Title "Frontend" -WorkingDir $FrontendDir -Script "if (Test-Path pnpm-lock.yaml) { pnpm i; pnpm run dev } else { npm i; npm run dev }" }

# Additionally run silent monitored processes to capture logs for auto-fix loop
$logsRoot = Join-Path $WorkspaceRoot ".dev-logs"
$frontendLog = Join-Path $logsRoot "frontend.log"
$backendLog  = Join-Path $logsRoot "backend.log"
if (Test-Path $FrontendDir) {
  $frontendProc = Start-DevProcess -WorkingDir $FrontendDir -CommandLine "if (Test-Path pnpm-lock.yaml) { pnpm i; pnpm run dev } else { npm i; npm run dev }" -LogFile $frontendLog
}
if (Test-Path $BackendDir) {
  $backendProc = Start-DevProcess -WorkingDir $BackendDir -CommandLine "if (Test-Path pnpm-lock.yaml) { pnpm i; pnpm run dev } else { npm i; npm run dev }" -LogFile $backendLog
}

# 5) Launch Edge with remote debugging enabled
$edgeExe = "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgeExe)) { $edgeExe = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
if (Test-Path $edgeExe) {
  $userDataDir = Join-Path $env:LOCALAPPDATA "EdgeRemoteDebugProfile"
  New-Item -ItemType Directory -Force -Path $userDataDir | Out-Null
  $edgeArgs = "--remote-debugging-port=$EdgeDebugPort --user-data-dir=`"$userDataDir`" $FrontendUrl"
  Start-ProcessDetached $edgeExe $edgeArgs
  Write-Host "Launched Edge with remote debugging on port $EdgeDebugPort"
} else {
  Write-Warning "Edge executable not found."
}

# 6) Launch VS Code on workspace
$codeCmd = Get-CodeCmd
if ($codeCmd) {
  & $codeCmd $WorkspaceRoot
} else {
  Write-Warning "VS Code CLI not found. Open VS Code manually at $WorkspaceRoot."
}

# 7) Launch Cursor
$cursorExe = Join-Path $env:LOCALAPPDATA "Programs\cursor\Cursor.exe"
if (Test-Path $cursorExe) {
  Start-ProcessDetached $cursorExe "--open-url `\"$WorkspaceRoot`\""
} else {
  Write-Host "If Cursor didn't launch, start it from Start Menu and open: $WorkspaceRoot"
}

Write-Host "All done. Once servers are up, Edge DevTools can attach to $FrontendUrl (port $EdgeDebugPort)."

# 8) Wait for frontend to be reachable and print final URL
if (Wait-ForHttp -Url $FrontendUrl -TimeoutSeconds 300 -IntervalSeconds 3) {
  Write-Host ""
  Write-Host "============================================================"
  Write-Host "Environment is ready. Open your app at: $FrontendUrl"
  Write-Host "============================================================"
  Write-Host "If the page doesn't auto-refresh in Edge, press Ctrl+R."
} else {
  Write-Warning "Timed out waiting for $FrontendUrl. Check the frontend dev server terminal for errors."
}

# 9) Stability loop: monitor logs, auto-fix, restart
$stableIterations = 0
$attempt = 0
while ($stableIterations -lt $MaxStabilityChecks -and $attempt -lt $MaxAutoFixAttempts) {
  Start-Sleep -Seconds $CheckIntervalSeconds
  $hasFrontendErrors = Test-LogsForErrors -LogFile $frontendLog
  $hasBackendErrors  = Test-LogsForErrors -LogFile $backendLog
  if (-not $hasFrontendErrors -and -not $hasBackendErrors) {
    $stableIterations++
    continue
  }
  $attempt++
  Write-Warning "Issues detected in logs (attempt $attempt). Running auto-fix routines..."
  if ($hasFrontendErrors) { Try-AutoFixIssue -ProjectDir $FrontendDir }
  if ($hasBackendErrors)  { Try-AutoFixIssue -ProjectDir $BackendDir }
  # Auto-commit and push any changes
  Git-CommitPush -RepoRoot $WorkspaceRoot -Message "chore(auto-fix): automated fix attempt $attempt"
  # Restart background processes
  try { if ($frontendProc -and -not $frontendProc.HasExited) { $frontendProc.Kill() } } catch { }
  try { if ($backendProc  -and -not $backendProc.HasExited)  { $backendProc.Kill() } } catch { }
  if (Test-Path $FrontendDir) { $frontendProc = Start-DevProcess -WorkingDir $FrontendDir -CommandLine "if (Test-Path pnpm-lock.yaml) { pnpm i; pnpm run dev } else { npm i; npm run dev }" -LogFile $frontendLog }
  if (Test-Path $BackendDir)  { $backendProc  = Start-DevProcess -WorkingDir $BackendDir  -CommandLine "if (Test-Path pnpm-lock.yaml) { pnpm i; pnpm run dev } else { npm i; npm run dev }" -LogFile $backendLog }
  $stableIterations = 0

  # If Render deployment is enabled, deploy after each fix and capture errors back into logs
  if ($RenderDeploy) {
    $deploy = Deploy-ToRender -RepoRoot (Split-Path $WorkspaceRoot -Parent)
    if ($deploy) {
      if ($deploy.stderr -and $deploy.stderr.Trim().Length -gt 0) {
        Add-Content -Path $frontendLog -Value "[render-error] $($deploy.stderr)"
        Add-Content -Path $backendLog -Value "[render-error] $($deploy.stderr)"
      }
    }
  }
}

if ($attempt -ge $MaxAutoFixAttempts) {
  Write-Warning "Reached max auto-fix attempts ($MaxAutoFixAttempts). Manual review may be required."
}
if ($stableIterations -ge $MaxStabilityChecks) {
  Write-Host "Services appear stable (no new errors detected)."
}

# 10) Optional Render deployment
if ($RenderDeploy) {
  $deploy = Deploy-ToRender -RepoRoot (Split-Path $WorkspaceRoot -Parent)
  $renderUrls = $null
  if ($deploy) { $renderUrls = $deploy.urls }
  if ($renderUrls -and $renderUrls.Count -gt 0) {
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "Live deployment URLs (Render):"
    foreach ($u in $renderUrls) { Write-Host " - $u" }
    Write-Host "============================================================"
  } else {
    Write-Warning "Render deployment did not yield URLs. Check output files deploy.out.txt / deploy.err.txt near repo root."
  }
}

# 11) Final Health Report
$report = [ordered]@{
  LocalFrontend = $FrontendUrl
  BackendHealth = (Test-Health -Url $BackendHealthUrl)
  CloudHealth   = @()
  StabilityChecksPassed = $stableIterations
  AutoFixAttempts       = $attempt
  RenderUrls            = $renderUrls
}
foreach ($u in $CloudHealthUrls) {
  $ok = Test-Health -Url $u
  $report.CloudHealth += @{ Url = $u; Healthy = $ok }
}
Write-Host ""
Write-Host "=================== FINAL REPORT ==================="
Write-Host ("Local Frontend: {0}" -f $report.LocalFrontend)
Write-Host ("Backend healthy: {0}" -f $report.BackendHealth)
foreach ($entry in $report.CloudHealth) { Write-Host ("Cloud {0} healthy: {1}" -f $entry.Url, $entry.Healthy) }
Write-Host ("Auto-fix attempts: {0}" -f $report.AutoFixAttempts)
Write-Host ("Stability checks passed: {0}" -f $report.StabilityChecksPassed)
if ($report.RenderUrls) { $report.RenderUrls | ForEach-Object { Write-Host ("Render URL: {0}" -f $_) } }
Write-Host "===================================================="


