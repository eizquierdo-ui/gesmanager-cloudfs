# Este script automatiza el proceso de despliegue a Firebase Hosting en PowerShell.

Write-Host "Limpiando compilaciones anteriores (Remove-Item -Recurse -Force dist)..." -ForegroundColor Cyan
if (Test-Path -Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

Write-Host "Construyendo la aplicación de React (npm run build)..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en la construcción (build). Cancelando despliegue." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Desplegando a Firebase Hosting proyecto gesmanager-cloundfs..." -ForegroundColor Cyan
npx -y firebase-tools deploy --only hosting --project gesmanager-cloundfs

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n¡Despliegue completado! La nueva versión ya está disponible en la URL pública." -ForegroundColor Green
} else {
    Write-Host "`nOcurrió un error en el despliegue." -ForegroundColor Red
}
