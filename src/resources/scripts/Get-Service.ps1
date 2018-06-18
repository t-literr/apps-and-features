<#

.SYNOPSIS
Gets a list of all modern apps, retrieves display name and publisher from the manifest file,
the install date of the manifest file, and the total size of directory.
.DESCRIPTION
Gets a list of all modern apps, retrieves display name and publisher from the manifest file,
the install date of the manifest file, and the total size of directory.

.ROLE
Readers

#>

# recursively walks down installed location directory and totals size of subdirectories + files
function size([string] $directory) {
  foreach ($item in (Get-ChildItem $directory -recurse | Where-Object {-not $_.PSIsContainer} | ForEach-Object {$_.FullName})) {
    $size += (Get-Item $item).Length
  }

  $formattedSize = $size / 1GB
  $unit = 'GB'
  $power = 1024

  # smaller than 1GB
  if ($formattedSize -lt 1) {
    $formattedSize = $formattedSize * $power
    $unit = 'MB'
    #smaller than 1MB
    if ($formattedSize -lt 1) {
      $formattedSize = $formattedSize * $power
      $unit = 'KB'
    }
  }

  # round to 2 decimals points
  $formattedSize = [math]::round($formattedSize, 2)

  # return size and unit to print
  $formattedSize
  $unit
}

$result = Get-AppxPackage

foreach ($app in $result) {
  $directory = $app.installLocation
  $manifestFile = get-childItem $directory -filter appxmanifest.xml
  [xml]$content = get-content $directory/$manifestFile

  # get additional values for output
  $displayName = $content.Package.Properties.DisplayName
  $installDate = $manifestFile.LastWriteTime
  $publisherDisplayName = $content.Package.Properties.PublisherDisplayName
  $size = size($directory) #size[0] = size, size[1] = unit
  $sizeOutput = [string]$size[0] + " " + $size[1]

  # add new values to object to pass to service class
  $app | add-member displayName $displayName
  $app | add-member installDate $installDate
  $app | add-member publisherDisplayName $publisherDisplayName
  $app | add-member size $sizeOutput
}

return $result

