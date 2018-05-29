<#

.SYNOPSIS
Sets the current log on user for the specified service.

.DESCRIPTION
Sets the current log on user for the specified service.

.ROLE
Administrators

#>

param (
    [Parameter(Mandatory = $true)] [string] $serviceName,
    [string] $username,
    [string] $password
)

if ($username -and $password) {
    Invoke-Expression "$($env:SystemDrive)\Windows\System32\sc.exe config $($serviceName) obj= `"$($username)`" password= $($password)" > $null
}
else {
    Invoke-Expression "$($env:SystemDrive)\Windows\System32\sc.exe config $($serviceName) obj= LocalSystem" > $null
}

$result = New-Object PSObject
$result | Add-Member -MemberType NoteProperty -Name 'ExitCode' -Value $LASTEXITCODE
$exceptionObject = [ComponentModel.Win32Exception]$LASTEXITCODE
if ($exceptionObject) {
    $result | Add-Member -MemberType NoteProperty -Name 'ErrorMessage' -Value $exceptionObject.message
}

$result
