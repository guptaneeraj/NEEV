@echo off
set PATH=%PATH%;C:\nodejs\node-v20.12.0-win-x64
echo Installing frontend dependencies...
C:\nodejs\node-v20.12.0-win-x64\npm.cmd install --force
echo Done!
pause
