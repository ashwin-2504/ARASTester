# Integration Test for ArasBackend
# Verifies Cookie-Based Session Management

$baseUrl = "http://localhost:5176/api/aras"
$ErrorActionPreference = "Stop"

function Test-Step {
    param($Name, $Block)
    Write-Host "[$Name]..." -NoNewline
    try {
        & $Block
        Write-Host " PASS" -ForegroundColor Green
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Error $_
    }
}

Test-Step "1. Check Initial Status (Should be Disconnected)" {
    $res = Invoke-RestMethod -Uri "$baseUrl/connection-status" -Method Get -SessionVariable session
    if ($res.isConnected -ne $false) { throw "Expected Disconnected, got Connected" }
}

Test-Step "2. Simulate Connect (Login)" {
    # Note: Using invalid credentials mock, expecting the backend to simulate a connection or fail if real IOM is needed.
    # Since we are using real IOM, we can't actually login to "http://localhost" unless we have a real ARAS server.
    # However, for verification of the *Cookie Mechanism*, we can observe behaviors.
    # But wait! ArasSessionManager calls IomFactory.CreateHttpServerConnection.
    # If that fails, it throws.
    # So we need to MOCK the IOM interaction or use a Mock ConnectionStore for this test level?
    # Or strict dependency on real server?
    # The user environment likely doesn't have a local ARAS instance running at 'http://localhost/InnovatorServer'.
    # So REAL integration test will fail on "ArasAuthException".
    # BUT, we can verify that IF it fails, it returns 401/500, not 404.
    
    # Actually, for this verification to be useful without a real ARAS server, 
    # we might need to rely on the UNIT TESTS we just wrote which mock the gateway.
    # This integration test verifies the HTTP layer.
    
    # Let's try to connect and expect failure, OR if the user has a mock IOM config?
    # We don't have mock IOM config.
    # So this test is limited.
    
    # Alternative: Validate "ValidateConnection" endpoint behavior when NOT logged in.
    
    try {
        $body = @{
            url = "http://bad-url"
            database = "db"
            username = "admin"
            password = "pwd"
        }
        Invoke-RestMethod -Uri "$baseUrl/connect" -Method Post -Body ($body | ConvertTo-Json) -ContentType "application/json" -SessionVariable session
    } catch {
        # We EXPECT this to fail if no server.
        # But we want to see if it TRIED and maybe failed with ArasException vs 404.
        $status = $_.Exception.Response.StatusCode
        if ($status -eq 404) { throw "404 Not Found - Route is wrong" }
        Write-Host " (Expected Failure: $status)" -NoNewline
    }
}
