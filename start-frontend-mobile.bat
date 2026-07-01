@echo off
REM ============================================================
REM Script de démarrage MarketWatch Frontend - Accessible sur téléphone
REM ============================================================

echo.
echo 📱 MarketWatch - Frontend (Accessible sur téléphone et desktop)
echo ============================================================
echo.

cd /d "%~dp0frontend" || (
  echo ❌ Erreur: le dossier frontend n'a pas été trouvé
  pause
  exit /b 1
)

REM Vérifier que node_modules existe
if not exist "node_modules" (
  echo 📦 Installation des dépendances...
  call npm install
  if errorlevel 1 (
    echo ❌ Erreur lors de l'installation
    pause
    exit /b 1
  )
)

echo ✅ Démarrage du serveur Vite...
echo.
echo 🖥️  Desktop (localhost)  : http://localhost:5173
echo 📱 Téléphone (local Wi-Fi): http://^<votre-adresse-ip^>:5173
echo.
echo Pour trouver votre adresse IP, tapez: ipconfig
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo.

call npm run dev

pause
