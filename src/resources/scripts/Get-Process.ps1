<#

.SYNOPSIS
Sets the current log on user for the specified service.

.DESCRIPTION
Sets the current log on user for the specified service.

.ROLE
Administrators

#>

Param([string]$packageName)
Remove-AppxPackage ($packageName)

