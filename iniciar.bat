@echo off
title Iniciar Sistema de Velas
cd /d "%~dp0"

echo Iniciando backend (puerto 3000)...
start "Backend - Velas" cmd /k "npm run dev"

echo Iniciando frontend (puerto 4200)...
start "Frontend - Velas" cmd /k "cd frontend && npm start"

echo Esperando a que compile el frontend...
timeout /t 25 /nobreak >nul
start http://localhost:4200

echo Listo. Para apagar el sistema cierre las dos ventanas negras.
timeout /t 5 >nul
