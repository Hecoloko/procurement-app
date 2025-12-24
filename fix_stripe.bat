@echo off
echo ==========================================
echo      DEPLOYING STRIPE WEBHOOK FIX
echo ==========================================
echo.
echo Attempting to deploy 'stripe-webhook' with public access...
echo.

call npx supabase functions deploy stripe-webhook --project-ref hrlyuobsabqpdafuylgo --no-verify-jwt

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Deployment failed.
    echo You may need to login first. Try running: npx supabase login
    echo.
) else (
    echo.
    echo [SUCCESS] Webhook fixed! Payments should now sync correctly.
)

pause
