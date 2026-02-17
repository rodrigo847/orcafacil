@echo off
setlocal
cd /d "%~dp0"

echo === Teste local ===
if not exist node_modules\ (
  echo Instalando dependencias...
  npm install
)

echo Iniciando servidor local...
call npm run dev

echo Servidor encerrado.
pause
