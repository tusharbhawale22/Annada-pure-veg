@echo off
title Annada Pure Veg - GitHub Push Helper
echo ===================================================
echo   Annada Pure Veg - GitHub Push Helper 🚀
echo ===================================================
echo.
echo This helper script will push your local changes to GitHub
echo using your native Windows network connection.
echo.
echo Pushing changes...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Standard push failed. Trying fallback push (bypassing SSL verification)...
    echo.
    git -c http.sslVerify=false push origin main
)
echo.
echo ===================================================
echo Process complete. You can now close this window.
echo ===================================================
pause
