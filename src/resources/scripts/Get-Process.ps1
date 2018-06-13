Param([string]$prodID)
$app = Get-WmiObject -Class Win32_Product | Where-Object {
  $_.IdentifyingNumber -match ($prodID)
}

$app.Uninstall()
