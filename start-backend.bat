@echo off
echo ================================================
echo   MarketWatch Senegal - Demarrage Backend
echo   Spring Boot + PostgreSQL
echo ================================================
echo.

REM Demarrer PostgreSQL via Docker si pas deja lance
echo [1/3] Demarrage de PostgreSQL (Docker)...
docker compose up -d postgres
if %errorlevel% neq 0 (
    echo ERREUR: Docker n'est pas lance ou introuvable.
    echo Installez Docker Desktop: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

echo [2/3] Attente de la disponibilite de PostgreSQL...
timeout /t 5 /nobreak >nul

echo [3/3] Demarrage du backend Spring Boot...
cd backend
mvn spring-boot:run -q

$env:PATH = "$env:USERPROFILE\.maven-portable\bin;$env:PATH"
cd C:\Users\DELL\Documents\DITI5\marketwatch_v2\backend
mvn spring-boot:run


if %errorlevel% neq 0 (
    echo ERREUR: Maven non trouve. Installez Maven ou verifiez votre PATH.
    pause
    exit /b 1
)

pause
