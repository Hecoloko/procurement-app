Write-Host "Deploying Stripe Backend to Supabase Cloud..." -ForegroundColor Cyan

# 1. Set the Secret (Project: hrlyuobsabqpdafuylgo)
Write-Host "Setting Secrets..."
$env:SUPABASE_ACCESS_TOKEN = $null # Ensure we trigger login if needed, though usually cached
cmd /c "npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUwOTU2MywiZXhwIjoyMDc5MDg1NTYzfQ.MjJLAqu4sGFTFyqWutWmeorTqilIWQJ88hMee0673r0 --project-ref hrlyuobsabqpdafuylgo"

# 2. Deploy Functions
Write-Host "Deploying 'create-checkout' function..."
cmd /c "npx supabase functions deploy create-checkout --project-ref hrlyuobsabqpdafuylgo --no-verify-jwt"

Write-Host "Deploying 'stripe-webhook' function..."
cmd /c "npx supabase functions deploy stripe-webhook --project-ref hrlyuobsabqpdafuylgo --no-verify-jwt"

Write-Host "Deployment Complete! Stripe integration is now live on the cloud." -ForegroundColor Green
Write-Host "You can verify by clicking 'Generate Payment Link' in the Dashboard."
