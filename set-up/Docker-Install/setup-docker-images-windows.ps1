#Requires -Version 5.1
<#
.SYNOPSIS
    Lance la stack Chess-App a partir des images publiees.

.USAGE
    powershell -ExecutionPolicy Bypass -File .\set-up\Docker-Install\setup-docker-images-windows.ps1
#>

$ErrorActionPreference = "Stop"

$ComposeFile = "docker-compose.images.yaml"
$ComposeFileRawUrl = "https://raw.githubusercontent.com/xpelletier07/Chess-App/dev/docker-compose.images.yaml"
$ComposeProjectName = "chess-app-images"
$DefaultRunDir = Join-Path $Env:LOCALAPPDATA "Chess-App\images-stack"

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    [!!] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "    [XX] $msg" -ForegroundColor Red }

function Stop-WithError {
    param(
        [Parameter(Mandatory = $true)][string]$Message,
        [string]$Hint
    )

    Write-Err $Message
    if ($Hint) {
        Write-Host "    => $Hint" -ForegroundColor Yellow
    }
    exit 1
}

Write-Step "Verification des prerequis Docker"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Stop-WithError "Docker est introuvable." "Installe Docker Desktop puis relance le script."
}
Write-Ok "Commande docker detectee"

docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Docker Compose (plugin v2) est indisponible." "Mets Docker Desktop a jour puis relance."
}
Write-Ok "Docker Compose detecte"

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Le moteur Docker ne repond pas." "Demarre Docker Desktop puis relance."
}
Write-Ok "Moteur Docker actif"

Write-Step "Telechargement de la configuration d'images"
if (-not (Test-Path $DefaultRunDir -PathType Container)) {
    New-Item -ItemType Directory -Path $DefaultRunDir -Force | Out-Null
}
$ComposePath = Join-Path $DefaultRunDir $ComposeFile
try {
    Invoke-WebRequest -Uri $ComposeFileRawUrl -OutFile $ComposePath -UseBasicParsing
} catch {
    Stop-WithError "Impossible de telecharger $ComposeFile." "Verifie l'acces a GitHub puis relance."
}
Write-Ok "Compose telecharge: $ComposePath"

Write-Step "Telechargement des images les plus recentes"
docker compose --project-name $ComposeProjectName -f $ComposePath pull
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Impossible de telecharger les images." "Si GHCR est prive, execute docker login ghcr.io puis relance."
}
Write-Ok "Images telechargees"

Write-Step "Demarrage de la stack et initialisation de PostgreSQL"
docker compose --project-name $ComposeProjectName -f $ComposePath up -d
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Echec du demarrage via docker compose." "Consulte les logs avec la commande affichee ci-dessous."
}

Write-Host ""
Write-Ok "Stack demarree avec succes."
Write-Ok "Site : http://localhost:5173"
Write-Ok "API  : http://localhost:3000"
Write-Ok "Etat : docker compose --project-name $ComposeProjectName -f `"$ComposePath`" ps"
Write-Ok "Logs : docker compose --project-name $ComposeProjectName -f `"$ComposePath`" logs -f"
