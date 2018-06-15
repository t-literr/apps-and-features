<#

.SYNOPSIS
Gets a list of all modern apps, retrieves display name from manifest file and returns.

.DESCRIPTION
Gets a list of all modern apps, retrieves display name from the manifest file and
the install date of the manifest file and then returns.

.ROLE
Readers

#>

$result = Get-AppxPackage

foreach ($app in $result) {
  $directory = $app.installLocation
  $manifestFile = get-childItem $directory -filter appxmanifest.xml
  [xml]$content = get-content $directory/$manifestFile
  $displayName = $content.Package.Properties.DisplayName
  $installDate = $manifestFile.LastWriteTime
  $publisherDisplayName = $content.Package.Properties.PublisherDisplayName
  $app | add-member displayName $displayName
  $app | add-member installDate $installDate
  $app | add-member publisherDisplayName $publisherDisplayName
}

return $result

