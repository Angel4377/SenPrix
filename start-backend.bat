@echo off
echo ================================================
echo   MarketWatch Senegal - Demarrage Backend
echo   Spring Boot + PostgreSQL (local, hors Docker)
echo ================================================
echo.
echo Pre-requis : le service PostgreSQL local doit deja tourner
echo (verifiable dans services.msc -> postgresql-x64-...)
echo avec une base "marketwatch_db" accessible via postgres/passer.
echo.

cd backend
call mvn spring-boot:run
if %errorlevel% neq 0 (
    echo ERREUR: Maven non trouve, ou echec du demarrage.
    echo Verifiez que PostgreSQL est bien demarre et que le mot de passe
    echo dans backend\src\main\resources\application.properties est correct.
    pause
    exit /b 1
)

pause
