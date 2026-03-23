@echo off
echo [1/3] Force killing any hanging emulator processes...
taskkill /F /IM qemu-system-x86_64.exe /T 2>nul
taskkill /F /IM qemu-system-i386.exe /T 2>nul
taskkill /F /IM emulator.exe /T 2>nul

echo [2/3] Searching for and removing AVD lock files...
:: This looks into the default Android AVD directory
cd /d %USERPROFILE%\.android\avd
for /d %%i in (*.avd) do (
    if exist "%%i\*.lock" (
        echo Removing locks in %%i...
        del /s /q "%%i\*.lock" 2>nul
    )
)

echo [3/3] Restarting ADB server...
adb kill-server
adb start-server

echo.
echo ✅ Hanging processes killed and lock files removed.
echo You can now try to start the emulator again from Android Studio.
pause
