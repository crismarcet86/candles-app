@echo off
title Detener Sistema de Velas

echo Deteniendo backend (puerto 3000) y frontend (puerto 4200)...

for %%P in (3000 4200) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    taskkill /F /PID %%I >nul 2>&1
    echo Puerto %%P detenido (PID %%I^)
  )
)

REM Cierra las ventanas abiertas por iniciar.bat
taskkill /F /FI "WINDOWTITLE eq Backend - Velas*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend - Velas*" >nul 2>&1

echo Listo.
timeout /t 3 >nul
