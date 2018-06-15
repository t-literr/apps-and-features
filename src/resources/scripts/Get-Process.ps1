<#

.SYNOPSIS
Sets the current log on user for the specified service.

.DESCRIPTION
Sets the current log on user for the specified service.

.ROLE
Administrators

#>

Param([string]$prodID)
$app = Get-WmiObject -Class Win32_Product | Where-Object {
  $_.IdentifyingNumber -match ($prodID)
}

$app.Uninstall()
