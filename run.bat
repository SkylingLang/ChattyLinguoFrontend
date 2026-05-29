@echo off
cd /d "%~dp0"

echo Starting backend...
start "ChattyLinguo Backend" cmd /k ".venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Starting mini app frontend...
start "ChattyLinguo Mini App" cmd /k "cd mini_app && flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8000"

echo.
echo Backend: http://localhost:8000
echo Mini App: http://localhost:5173
echo.
pause
