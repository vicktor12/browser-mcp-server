<#
.SYNOPSIS
  Copia o perfil do Chrome para um diretório não padrão (Windows).

.DESCRIPTION
  O Chrome 136+ recusa automação (DevTools/Playwright) no diretório de dados padrão.
  Este script copia "Local State" e o perfil (sem caches) para outra pasta, mantendo
  cookies e logins. Execute com o Chrome FECHADO e repita para atualizar as sessões.

.EXAMPLE
  ./scripts/copy-chrome-profile.ps1
  ./scripts/copy-chrome-profile.ps1 -Profile "Profile 1" -Destination D:\chrome-mcp
#>
param(
  [string]$Profile = "Default",
  [string]$Destination = (Join-Path $env:USERPROFILE ".browser-mcp-profile")
)

$ErrorActionPreference = "Stop"
$source = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data"

if (Get-Process chrome -ErrorAction SilentlyContinue) {
  throw "Feche o Chrome por completo antes de copiar o perfil."
}

New-Item -ItemType Directory -Force $Destination | Out-Null
Copy-Item (Join-Path $source "Local State") $Destination -Force

$excluded = "Cache", "Code Cache", "GPUCache", "Service Worker", "DawnGraphiteCache",
  "DawnWebGPUCache", "GrShaderCache", "ShaderCache", "Crashpad", "optimization_guide_model_store"
robocopy (Join-Path $source $Profile) (Join-Path $Destination $Profile) /E /XD $excluded /XF "*.log" `
  /NFL /NDL /NJH /NJS /NP /R:1 /W:1 | Out-Null
# robocopy usa códigos 0-7 para sucesso; >= 8 indica erro
if ($LASTEXITCODE -ge 8) { throw "robocopy falhou (código $LASTEXITCODE)" }

Write-Host "Perfil copiado para $Destination"
Write-Host "Use: CHROME_USER_DATA_DIR=$Destination  CHROME_PROFILE=$Profile"
