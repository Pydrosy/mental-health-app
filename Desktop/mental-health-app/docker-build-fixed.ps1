# docker-build-fixed.ps1
Write-Host "🚀 Building Mental Health App Docker Containers" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Step 1: Check if Docker is running
Write-Host "`n1️⃣ Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerVersion = docker version --format '{{.Server.Version}}' 2>$null
    if ($dockerVersion) {
        Write-Host "✅ Docker is running (Version: $dockerVersion)" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker is not running" -ForegroundColor Red
        Write-Host "Please start Docker Desktop from the Start Menu" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Red
    exit 1
}

# Step 2: Check if .env file exists
Write-Host "`n2️⃣ Checking environment variables..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Load .env file and display (without passwords)
    $envContent = Get-Content .env
    Write-Host "   Environment variables loaded:" -ForegroundColor Gray
    foreach ($line in $envContent) {
        if ($line -match '^[^#].*=' -and $line -notmatch 'PASSWORD|SECRET') {
            Write-Host "   $line" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "Creating template .env file..." -ForegroundColor Yellow
    
    @"
# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=SecurePassword123!

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(Get-Random)

# Agora (for video calls)
AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
AGORA_APP_CERTIFICATE=your-agora-certificate-here

# Frontend URL
FRONTEND_URL=http://localhost:3000
"@ | Out-File -FilePath .env -Encoding utf8
    
    Write-Host "✅ Template .env file created" -ForegroundColor Green
    Write-Host "⚠️ Please edit .env file with your actual values" -ForegroundColor Yellow
    exit 0
}

# Step 3: Stop any running containers
Write-Host "`n3️⃣ Stopping existing containers..." -ForegroundColor Yellow
docker-compose down
Write-Host "✅ Containers stopped" -ForegroundColor Green

# Step 4: Build and start containers
Write-Host "`n4️⃣ Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build -d

# Step 5: Check container status
Write-Host "`n5️⃣ Container status:" -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker-compose ps

# Step 6: Show logs
Write-Host "`n6️⃣ Recent logs:" -ForegroundColor Yellow
docker-compose logs --tail=20

Write-Host "`n✅ Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Services:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "  ML Service: http://localhost:8001" -ForegroundColor White
Write-Host "  MongoDB: localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Yellow
Write-Host "  View all logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "  View backend logs: docker-compose logs -f backend" -ForegroundColor Gray
Write-Host "  Stop containers: docker-compose down" -ForegroundColor Gray
Write-Host "  Restart containers: docker-compose restart" -ForegroundColor Gray
