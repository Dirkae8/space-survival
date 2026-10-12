$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = $null
$port = 8765

while ($port -lt 8790) {
    $candidate = New-Object System.Net.HttpListener
    $candidate.Prefixes.Add("http://localhost:$port/")
    try {
        $candidate.Start()
        $listener = $candidate
        break
    } catch {
        $candidate.Close()
        $port += 1
    }
}

if ($null -eq $listener) {
    Write-Host 'Не удалось запустить локальный сервер на портах 8765–8789.' -ForegroundColor Red
    Read-Host 'Нажмите Enter для выхода'
    exit 1
}

$url = "http://localhost:$port/"
Write-Host 'ПЕРИГЕЛИЙ запущен локально.' -ForegroundColor Cyan
Write-Host "Адрес игры: $url"
Write-Host 'Оставьте это окно открытым во время игры. Для остановки нажмите Ctrl+C.'
Start-Process $url

$rootPrefix = $root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$contentTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js' = 'text/javascript; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.woff' = 'font/woff'
    '.woff2' = 'font/woff2'
    '.svg' = 'image/svg+xml'
    '.png' = 'image/png'
    '.jpg' = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.ico' = 'image/x-icon'
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $relativePath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
            if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'index.html' }
            $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))

            if (-not $filePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                $context.Response.StatusCode = 403
                $context.Response.Close()
                continue
            }
            if (Test-Path -LiteralPath $filePath -PathType Container) {
                $filePath = Join-Path $filePath 'index.html'
            }
            if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
                $context.Response.StatusCode = 404
                $context.Response.Close()
                continue
            }

            $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
            if ($contentTypes.ContainsKey($extension)) {
                $context.Response.ContentType = $contentTypes[$extension]
            } else {
                $context.Response.ContentType = 'application/octet-stream'
            }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $context.Response.ContentLength64 = $bytes.Length
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            $context.Response.Close()
        } catch {
            try { $context.Response.StatusCode = 500; $context.Response.Close() } catch { }
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
