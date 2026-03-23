@echo off
echo [1/4] Cleaning Android build folders...
cd android
call gradlew clean
cd ..

echo [2/4] Clearing Metro Bundler cache...
rmdir /s /q %TEMP%\metro-cache 2>nul

echo [3/4] Uninstalling the app from the emulator...
adb uninstall com.neev-wellness-app 2>nul

echo [4/4] Wiping emulator data (Cold Boot)...
echo Please note: This script assumes you have 'emulator' in your PATH.
echo If it fails, manually go to AVD Manager -> Wipe Data on your device.

for /f "tokens=1" %%i in ('emulator -list-avds') do (
    echo Wiping data for AVD: %%i
    emulator -avd %%i -wipe-data -no-snapshot-load
    goto :started
)

:started
echo.
echo ✅ Emulator reset initiated.
echo Please wait for the emulator to fully boot, then run:
echo npm run android
pause
