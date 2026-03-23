@echo off
set "SDK_PATH=C:\Users\gupta\AppData\Local\Android\Sdk"
set "PATH=%SDK_PATH%\platform-tools;%SDK_PATH%\emulator;%SDK_PATH%\tools;%SDK_PATH%\tools\bin;%PATH%"

echo ✅ Android SDK paths added to current session.
echo.
echo Try running: adb devices
echo If a device appears, you can now run: npx react-native run-android
