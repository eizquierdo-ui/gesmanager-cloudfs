#!/bin/bash

# Este script automatiza el proceso de despliegue a Firebase Hosting.

# Paso 1: Limpiar cualquier carpeta de distribución anterior.
echo "Limpiando compilaciones anteriores (rm -rf dist)..."
rm -rf dist

# Paso 2: Construir la aplicación de React para producción.
echo "Construyendo la aplicación (npm run build)..."
npm run build

# Paso 3: Desplegar únicamente los archivos de Hosting a Firebase.
echo "Desplegando a Firebase Hosting (firebase deploy --only hosting)..."
firebase deploy --only hosting

echo ""
echo "¡Despliegue completado! La nueva versión ya está disponible en la URL pública."
