@echo off
echo ============================================
echo   AI Quest -- Temporary Public Test Tunnel
echo ============================================
echo.
echo Starting tunnel on https://aiquest-test.loca.lt
echo If the subdomain is taken, a random URL will be shown.
echo.
echo Make sure the AI Quest server is already running:
echo   node server/index.js
echo.
echo Press Ctrl+C to stop the tunnel.
echo.
lt --port 3000 --subdomain aiquest-test
pause
