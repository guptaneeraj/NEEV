@echo off
echo [1/1] Correcting AppRegistry component name...
set "INDEX_FILE=index.js"
:: Replace 'NeevWellnessApp' with 'neev-wellness-app' to match app.json
powershell -Command "(gc index.js) -replace 'NeevWellnessApp', 'neev-wellness-app' | Out-File -encoding ASCII index.js"

echo ✅ Component name in index.js updated to match app.json.
pause
