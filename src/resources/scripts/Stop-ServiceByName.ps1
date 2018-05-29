<#

.SYNOPSIS
Stop a service using Stop-Service cmdlet.

.DESCRIPTION
Stop a service using Stop-Service cmdlet.

.ROLE
Administrators

#>

Param(
[string]$Name
)

Stop-Service -Name $Name -Force