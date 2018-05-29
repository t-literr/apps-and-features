<#

.SYNOPSIS
Gets the current log on user for the specified service

.DESCRIPTION
Gets the current log on user for the specified service

.ROLE
Readers

#>

param (
    [Parameter(Mandatory = $true)] [string] $serviceName
)

$regPath = "Registry::HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\$($serviceName)"
$properties = Get-ItemProperty $regPath -Name ObjectName
if ($properties -and $properties.ObjectName) {
    $properties.ObjectName
}
else {
    "LocalSystem"
}

