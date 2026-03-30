#!/usr/bin/env powershell
# SmartStudy SQL Server Setup Script
# This script automates the database setup process

param(
    [string]$Server = "localhost",
    [string]$Username = "sa",
    [string]$Password = $(Read-Host -AsSecureString "Enter SQL Server password"),
    [string]$Database = "SmartStudyDB"
)

# Convert secure string to plain text
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($Password)
)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "SmartStudy Database Setup Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if SQLCMD is available
Write-Host "Checking for SQLCMD..." -ForegroundColor Yellow
try {
    $sqlCmd = Get-Command sqlcmd -ErrorAction Stop
    Write-Host "✓ SQLCMD found: $($sqlCmd.Source)" -ForegroundColor Green
} catch {
    Write-Host "✗ SQLCMD not found. Please install SQL Server command-line tools." -ForegroundColor Red
    exit 1
}

# Verify connection
Write-Host ""
Write-Host "Verifying SQL Server connection..." -ForegroundColor Yellow
$connectionTest = @"
SELECT @@VERSION AS SQLVersion;
"@

try {
    $connectionTest | & sqlcmd -S $Server -U $Username -P $plainPassword -b
    Write-Host "✓ Connection successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Connection failed. Check server name and credentials." -ForegroundColor Red
    exit 1
}

# Create database
Write-Host ""
Write-Host "Creating database and tables..." -ForegroundColor Yellow
if (Test-Path "scripts\01-create-database.sql") {
    try {
        & sqlcmd -S $Server -U $Username -P $plainPassword -i "scripts\01-create-database.sql"
        Write-Host "✓ Database and tables created successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to create database" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Script file not found: scripts\01-create-database.sql" -ForegroundColor Red
    exit 1
}

# Seed data
Write-Host ""
Write-Host "Seeding sample data..." -ForegroundColor Yellow
if (Test-Path "scripts\02-seed-data.sql") {
    try {
        & sqlcmd -S $Server -U $Username -P $plainPassword -i "scripts\02-seed-data.sql"
        Write-Host "✓ Sample data inserted successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to seed data" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Script file not found: scripts\02-seed-data.sql" -ForegroundColor Red
    exit 1
}

# Update configuration
Write-Host ""
Write-Host "Updating database configuration..." -ForegroundColor Yellow
Write-Host "Update the following in lib/db-config.js:" -ForegroundColor Cyan
Write-Host "  Server: $Server"
Write-Host "  Database: $Database"
Write-Host "  Username: $Username"
Write-Host ""

# Install npm dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✓ npm dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install npm dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update lib/db-config.js with your SQL Server credentials" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start the application" -ForegroundColor White
Write-Host "3. Visit http://localhost:3000" -ForegroundColor White
