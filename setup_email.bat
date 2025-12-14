
@echo off
echo ==========================================
echo      SETTING UP EMAIL SYSTEM (RESEND)
echo ==========================================
echo.
echo 1. We need to log you in to Supabase.
echo    A browser window will open. Please click "Confirm".
echo.
call npx supabase login
if %ERRORLEVEL% NEQ 0 (
    echo Login failed or was cancelled.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2. Setting Resend API Key...
call npx supabase secrets set RESEND_API_KEY=re_D4P4QBfW_J7haVa43hHtLMMPigR2X9p8r
if %ERRORLEVEL% NEQ 0 (
    echo Failed to set secret.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 3. Deploying Email Function...
call npx supabase functions deploy send-email --no-verify-jwt
if %ERRORLEVEL% NEQ 0 (
    echo Deployment failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================
echo      SUCCESS! EMAIL SYSTEM IS LIVE
echo ==========================================
pause
