@echo off
echo ================================================
echo   MarketWatch Senegal - Demarrage Frontend
echo   React 18 + Vite 5
echo ================================================
echo.

cd frontend

echo [1/2] Installation des dependances npm...
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: npm n'est pas installe. Installez Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo [2/2] Demarrage du serveur de developpement Vite...
echo.
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8080
echo.
call npm run dev

pause


