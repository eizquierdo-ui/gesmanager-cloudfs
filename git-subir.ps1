# git-subir.ps1
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Asistente de Subida a GitHub (Backup)   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Paso 1: Revisando el estado actual (git status)..." -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor DarkGray
git status
Write-Host "--------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

Write-Host "Paso 2: Limpieza de archivos" -ForegroundColor Yellow
Write-Host "Revisa detenidamente la lista de arriba." -ForegroundColor White
Write-Host "Si ves archivos temporales (como .bak, copias, o archivos de prueba) que NO debes subir," -ForegroundColor Red
Write-Host "presiona 'CTRL + C' ahora para cancelar este script, bórralos y luego vuelve a ejecutar '.\git-subir.ps1'." -ForegroundColor Red
Write-Host ""
pause
Write-Host ""

Write-Host "Paso 3: Preparando el Commit" -ForegroundColor Yellow
$commitMessage = Read-Host "Ingresa la descripción de los cambios realizados para el historial de Git"

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    Write-Host "Error: El mensaje no puede estar vacío. Proceso cancelado." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Ejecutando: git add ." -ForegroundColor Cyan
git add .

Write-Host "Ejecutando: git commit -m `"$commitMessage`"" -ForegroundColor Cyan
git commit -m $commitMessage

Write-Host "Ejecutando: git push origin main" -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n¡Tus cambios han sido respaldados en GitHub con éxito! 🚀" -ForegroundColor Green
} else {
    Write-Host "`nHubo un problema al intentar subir los cambios. Por favor revisa los errores arriba." -ForegroundColor Red
}
