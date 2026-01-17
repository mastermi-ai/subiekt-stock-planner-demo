# PowerShell Commands for Client Machine
# Save this as: resync_client_commands.ps1
# Run as Administrator!

Write-Host "🔄 CONNECTOR RE-SYNC PROCEDURE" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Step 1: Stop Service
Write-Host "Step 1: Stopping connector service..." -ForegroundColor Yellow
Stop-Service -Name "PlannerConnector" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
$status = Get-Service -Name "PlannerConnector"
Write-Host "Service status: $($status.Status)`n" -ForegroundColor Green

# Step 2: Clear State
Write-Host "Step 2: Clearing sync state..." -ForegroundColor Yellow
$statePath = "C:\ProgramData\PlannerConnector\sync_state.json"
if (Test-Path $statePath) {
    Remove-Item -Path $statePath -Force
    Write-Host "✅ State file removed`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  State file not found (already cleared)`n" -ForegroundColor Yellow
}

# Step 3: Start Service
Write-Host "Step 3: Starting connector service..." -ForegroundColor Yellow
Start-Service -Name "PlannerConnector"
Start-Sleep -Seconds 3
$status = Get-Service -Name "PlannerConnector"
Write-Host "Service status: $($status.Status)`n" -ForegroundColor Green

# Step 4: Monitor Logs
Write-Host "Step 4: Opening logs..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop monitoring`n" -ForegroundColor Cyan

$logPath = "C:\ProgramData\PlannerConnector\logs"
if (Test-Path $logPath) {
    Set-Location $logPath
    $latestLog = Get-ChildItem -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestLog) {
        Write-Host "Monitoring: $($latestLog.Name)`n" -ForegroundColor Green
        Get-Content $latestLog.FullName -Tail 20 -Wait
    } else {
        Write-Host "⚠️  No log files found yet. Wait a moment and check manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Log directory not found: $logPath" -ForegroundColor Red
}
