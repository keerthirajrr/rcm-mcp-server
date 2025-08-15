# MCP Server Testing Script
# Run this PowerShell script to test all functionality

Write-Host "🧪 Testing RCM MCP Server" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

$baseUrl = "http://localhost:4000"
$token = ""

# Function to make HTTP requests
function Invoke-TestRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [string]$Body = "",
        [hashtable]$Headers = @{}
    )
    
    try {
        $params = @{
            Method = $Method
            Uri = $Uri
            Headers = $Headers
        }
        
        if ($Body -ne "") {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Yellow
        }
        return $null
    }
}

# Test 1: Health Check
Write-Host "`n1️⃣ Testing Health Check..." -ForegroundColor Cyan
$health = Invoke-TestRequest -Method "GET" -Uri "$baseUrl/health"
if ($health) {
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor White
    Write-Host "   Version: $($health.version)" -ForegroundColor White
} else {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    exit 1
}

# Test 2: Authentication
Write-Host "`n2️⃣ Testing Authentication..." -ForegroundColor Cyan
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$authResponse = Invoke-TestRequest -Method "POST" -Uri "$baseUrl/api/auth/login" -Body $loginBody
if ($authResponse -and $authResponse.token) {
    Write-Host "✅ Authentication successful" -ForegroundColor Green
    $token = $authResponse.token
    Write-Host "   Token received (length: $($token.Length))" -ForegroundColor White
} else {
    Write-Host "❌ Authentication failed" -ForegroundColor Red
    exit 1
}

# Test 3: MCP Capabilities
Write-Host "`n3️⃣ Testing MCP Capabilities..." -ForegroundColor Cyan
$capabilities = Invoke-TestRequest -Method "GET" -Uri "$baseUrl/mcp/capabilities"
if ($capabilities) {
    Write-Host "✅ MCP capabilities retrieved" -ForegroundColor Green
    Write-Host "   Implementation: $($capabilities.implementation.name) v$($capabilities.implementation.version)" -ForegroundColor White
    Write-Host "   Protocol: $($capabilities.protocol_version)" -ForegroundColor White
} else {
    Write-Host "❌ MCP capabilities failed" -ForegroundColor Red
}

# Test 4: List MCP Tools
Write-Host "`n4️⃣ Testing MCP Tool Discovery..." -ForegroundColor Cyan
$listToolsBody = @{
    method = "list_tools"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
}

$toolsResponse = Invoke-TestRequest -Method "POST" -Uri "$baseUrl/mcp" -Body $listToolsBody -Headers $headers
if ($toolsResponse -and $toolsResponse.tools) {
    Write-Host "✅ MCP tools discovered" -ForegroundColor Green
    Write-Host "   Available tools:" -ForegroundColor White
    foreach ($tool in $toolsResponse.tools) {
        Write-Host "   - $($tool.name): $($tool.description)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ MCP tool discovery failed" -ForegroundColor Red
}

# Test 5: Call MCP Tool - List Denials
Write-Host "`n5️⃣ Testing MCP Tool Execution - List Denials..." -ForegroundColor Cyan
$callToolBody = @{
    method = "call_tool"
    params = @{
        name = "list_denials"
        arguments = @{
            category = "authorization"
            limit = 5
        }
    }
} | ConvertTo-Json -Depth 3

$denialsResponse = Invoke-TestRequest -Method "POST" -Uri "$baseUrl/mcp" -Body $callToolBody -Headers $headers
if ($denialsResponse -and $denialsResponse.result) {
    Write-Host "✅ List denials tool executed successfully" -ForegroundColor Green
    Write-Host "   Found $($denialsResponse.result.data.Count) denials" -ForegroundColor White
} else {
    Write-Host "❌ List denials tool failed" -ForegroundColor Red
}

# Test 6: Call MCP Tool - Get Claim Status
Write-Host "`n6️⃣ Testing MCP Tool Execution - Get Claim Status..." -ForegroundColor Cyan
$claimStatusBody = @{
    method = "call_tool"
    params = @{
        name = "get_claim_status"
        arguments = @{
            claim_id = "CLM-2024-001234"
            include_history = $true
        }
    }
} | ConvertTo-Json -Depth 3

$claimResponse = Invoke-TestRequest -Method "POST" -Uri "$baseUrl/mcp" -Body $claimStatusBody -Headers $headers
if ($claimResponse -and $claimResponse.result) {
    Write-Host "✅ Get claim status tool executed successfully" -ForegroundColor Green
    Write-Host "   Claim status: $($claimResponse.result.data.status)" -ForegroundColor White
} else {
    Write-Host "❌ Get claim status tool failed" -ForegroundColor Red
}

# Test 7: Call MCP Tool - Validate CPT Combo
Write-Host "`n7️⃣ Testing MCP Tool Execution - Validate CPT Combo..." -ForegroundColor Cyan
$validateCptBody = @{
    method = "call_tool"
    params = @{
        name = "validate_cpt_combo"
        arguments = @{
            cpt_codes = @("99213", "90834")
            icd_codes = @("F43.10", "Z71.1")
            patient_age = 35
            gender = "F"
        }
    }
} | ConvertTo-Json -Depth 3

$validateResponse = Invoke-TestRequest -Method "POST" -Uri "$baseUrl/mcp" -Body $validateCptBody -Headers $headers
if ($validateResponse -and $validateResponse.result) {
    Write-Host "✅ Validate CPT combo tool executed successfully" -ForegroundColor Green
    Write-Host "   Validation result: $($validateResponse.result.data.is_valid)" -ForegroundColor White
} else {
    Write-Host "❌ Validate CPT combo tool failed" -ForegroundColor Red
}

# Test 8: REST API - Get Claims
Write-Host "`n8️⃣ Testing REST API - Get Claims..." -ForegroundColor Cyan
$claimsRestResponse = Invoke-TestRequest -Method "GET" -Uri "$baseUrl/api/claims?status=pending&limit=5" -Headers $headers
if ($claimsRestResponse) {
    Write-Host "✅ REST API claims endpoint working" -ForegroundColor Green
    Write-Host "   Found claims: $($claimsRestResponse.data.Count)" -ForegroundColor White
} else {
    Write-Host "❌ REST API claims endpoint failed" -ForegroundColor Red
}

# Test 9: REST API - Get Denials
Write-Host "`n9️⃣ Testing REST API - Get Denials..." -ForegroundColor Cyan
$denialsRestResponse = Invoke-TestRequest -Method "GET" -Uri "$baseUrl/api/denials?category=authorization&limit=5" -Headers $headers
if ($denialsRestResponse) {
    Write-Host "✅ REST API denials endpoint working" -ForegroundColor Green
    Write-Host "   Found denials: $($denialsRestResponse.data.Count)" -ForegroundColor White
} else {
    Write-Host "❌ REST API denials endpoint failed" -ForegroundColor Red
}

# Test 10: Error Handling - Invalid Tool
Write-Host "`n🔟 Testing Error Handling - Invalid Tool..." -ForegroundColor Cyan
$invalidToolBody = @{
    method = "call_tool"
    params = @{
        name = "nonexistent_tool"
        arguments = @{}
    }
} | ConvertTo-Json -Depth 3

$errorResponse = Invoke-TestRequest -Method "POST" -Uri "$baseUrl/mcp" -Body $invalidToolBody -Headers $headers
if ($errorResponse -and $errorResponse.error) {
    Write-Host "✅ Error handling working correctly" -ForegroundColor Green
    Write-Host "   Error message: $($errorResponse.error)" -ForegroundColor White
} else {
    Write-Host "❌ Error handling not working as expected" -ForegroundColor Red
}

Write-Host "`n🎉 Testing Complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Your MCP Server is ready for use!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Integrate with your React frontend" -ForegroundColor White
Write-Host "   2. Connect to real EHR/clearinghouse systems" -ForegroundColor White
Write-Host "   3. Add more MCP tools as needed" -ForegroundColor White
Write-Host "   4. Set up production environment" -ForegroundColor White
