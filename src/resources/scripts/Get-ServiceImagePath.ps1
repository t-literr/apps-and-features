<#

.SYNOPSIS
Gets the path for the specified service.

.DESCRIPTION
Gets the path for the specified service.

.ROLE
Readers

#>

param (
    [Parameter(Mandatory = $true)] [string] $serviceName
)

$regPath = "Registry::HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\$($serviceName)"
$properties = Get-ItemProperty $regPath -Name ImagePath
if ($properties -and $properties.ImagePath) {
  $properties.ImagePath
}
