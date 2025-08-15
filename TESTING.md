# Manual Testing Guide for MCP Server

## 🚀 Quick Start Testing

### Prerequisites
- MCP Server running on http://localhost:4000
- PowerShell or Command Prompt

### 1. Basic Health Check
```bash
curl http://localhost:4000/health
```

### 2. Login to Get Authentication Token
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"admin\", \"password\": \"admin123\"}"
```

Save the returned token for subsequent requests.

### 3. Test MCP Capabilities
```bash
curl http://localhost:4000/mcp/capabilities
```

### 4. List Available MCP Tools
```bash
curl -X POST http://localhost:4000/mcp \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"method\": \"list_tools\"}"
```

### 5. Call MCP Tools

#### Get Claim Status
```bash
curl -X POST http://localhost:4000/mcp \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\": \"call_tool\",
    \"params\": {
      \"name\": \"get_claim_status\",
      \"arguments\": {
        \"claim_id\": \"CLM-2024-001234\",
        \"include_history\": true
      }
    }
  }"
```

#### List Denials
```bash
curl -X POST http://localhost:4000/mcp \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\": \"call_tool\",
    \"params\": {
      \"name\": \"list_denials\",
      \"arguments\": {
        \"category\": \"authorization\",
        \"limit\": 10
      }
    }
  }"
```

#### Validate CPT Combination
```bash
curl -X POST http://localhost:4000/mcp \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\": \"call_tool\",
    \"params\": {
      \"name\": \"validate_cpt_combo\",
      \"arguments\": {
        \"cpt_codes\": [\"99213\", \"90834\"],
        \"icd_codes\": [\"F43.10\", \"Z71.1\"],
        \"patient_age\": 35,
        \"gender\": \"F\"
      }
    }
  }"
```

#### Analyze Denial Root Cause
```bash
curl -X POST http://localhost:4000/mcp \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\": \"call_tool\",
    \"params\": {
      \"name\": \"analyze_denial_root_cause\",
      \"arguments\": {
        \"denial_id\": \"DEN-2024-005678\",
        \"include_recommendations\": true
      }
    }
  }"
```

#### Generate Appeal Letter
```bash
curl -X POST http://localhost:4000/mcp \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\": \"call_tool\",
    \"params\": {
      \"name\": \"generate_appeal_letter\",
      \"arguments\": {
        \"denial_id\": \"DEN-2024-005678\",
        \"template_type\": \"medical_necessity\",
        \"include_clinical_notes\": true
      }
    }
  }"
```

### 6. Test REST API Endpoints

#### Get Claims
```bash
curl -X GET "http://localhost:4000/api/claims?status=pending&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Get Denials
```bash
curl -X GET "http://localhost:4000/api/denials?category=authorization&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🧪 Using Postman

1. Import the following as a Postman collection:
   - Set base URL: `http://localhost:4000`
   - Add Authorization header: `Bearer {{token}}`
   - Create requests for each endpoint above

## 🔍 Expected Responses

### Successful Tool Call Response
```json
{
  "result": {
    "success": true,
    "data": {
      // Tool-specific data
    },
    "metadata": {
      "retrieved_at": "2025-08-15T18:30:00.000Z"
    }
  }
}
```

### Error Response
```json
{
  "error": "Invalid or missing tool name",
  "details": "Additional error information"
}
```

## 📊 Testing Checklist

- [ ] Server starts without errors
- [ ] Health check returns status 200
- [ ] Authentication works with test credentials
- [ ] MCP capabilities endpoint returns protocol info
- [ ] MCP tool discovery lists all 5 tools
- [ ] Each MCP tool executes successfully
- [ ] REST API endpoints return expected data
- [ ] Error handling works for invalid requests
- [ ] Authorization prevents unauthorized access
- [ ] Audit logs are created for sensitive operations

## 🐛 Troubleshooting

### Common Issues:

1. **Server won't start**: Check if port 4000 is available
2. **Authentication fails**: Verify JWT_SECRET is set in .env
3. **Tool execution fails**: Check if mock data adapters are working
4. **CORS errors**: Verify ALLOWED_ORIGINS in .env includes your client URL

### Log Files:
- `logs/error.log` - Application errors
- `logs/audit.log` - Security and compliance audit trail
