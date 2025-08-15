# Healthcare RCM MCP Server API

A comprehensive Node.js server implementing Model Context Protocol (MCP) for healthcare Revenue Cycle Management (RCM) that serves both React frontends and AI agents.

## 🏗️ Architecture

```
React Frontend  →  Node.js MCP Server API  →  Adapters (EHR / DB / Clearinghouse / Payer APIs)
                                    ↘  MCP Tool Interface (Model Context Protocol)
```

## ✨ Features

### Core RCM Functionality
- **Claim Status Tracking**: Real-time claim status from EHR/clearinghouses
- **Denial Management**: Comprehensive denial analytics and root cause analysis
- **Appeal Generation**: AI-powered appeal letter generation
- **CPT/ICD Validation**: Code combination validation with warnings
- **HIPAA Compliance**: Built-in PHI redaction and audit logging

### MCP Integration
- **Dual Interface**: REST API for React + MCP for AI agents
- **Tool-Based Architecture**: Modular MCP tools for specific RCM tasks
- **Context-Aware**: Authentication and permission-based data access
- **Extensible**: Easy to add new tools and adapters

### Security & Compliance
- **JWT Authentication**: Role-based access control
- **PHI Redaction**: Automatic sensitive data redaction
- **Audit Logging**: HIPAA-compliant audit trails
- **Rate Limiting**: DDoS protection
- **Input Validation**: Comprehensive request validation

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Development

```bash
npm run dev
```

The server will start on `http://localhost:4000`

### 4. Testing Authentication

```bash
# Login as admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use the returned token for subsequent requests
export TOKEN="your-jwt-token-here"
```

## 📚 API Documentation

### REST Endpoints (for React Frontend)

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/validate` - Token validation

#### Claims Management
- `GET /api/claims` - Search claims
- `GET /api/claims/:id` - Get specific claim status

#### Denial Analytics
- `GET /api/denials` - List denials with filtering
- `GET /api/denials/:id/analyze` - Root cause analysis

#### Appeal Management  
- `POST /api/appeals/generate` - Generate appeal letters

### MCP Interface (for AI Agents)

#### Tool Discovery
```bash
curl -X POST http://localhost:4000/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method": "list_tools"}'
```

#### Tool Execution
```bash
curl -X POST http://localhost:4000/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "call_tool",
    "params": {
      "name": "list_denials",
      "arguments": {
        "category": "authorization",
        "limit": 10
      }
    }
  }'
```

## 🛠️ Available MCP Tools

| Tool | Description | Required Scope |
|------|-------------|----------------|
| `get_claim_status` | Fetch claim status and history | `rcm.claim.read` |
| `list_denials` | Query denials with analytics | `rcm.denial.read` |
| `validate_cpt_combo` | Validate CPT/ICD combinations | `rcm.claim.read` |
| `analyze_denial_root_cause` | AI-powered denial analysis | `rcm.denial.read` |
| `generate_appeal_letter` | Create appeal letters | `rcm.appeal.write` |

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full access to all features
- **Billing Manager**: Claims, denials, appeals management
- **Biller**: Read claims/denials, basic operations
- **Readonly**: View-only access for reports

### Default Test Users
- Username: `admin`, Password: `admin123`
- Username: `billing_manager`, Password: `billing123`

### Scopes System
Fine-grained permissions:
- `rcm.claim.read/write` - Claim operations
- `rcm.denial.read/write` - Denial operations  
- `rcm.appeal.read/write` - Appeal operations
- `rcm.patient.read` - Patient data access
- `rcm.analytics.read` - Analytics access

## 🏥 Healthcare Compliance

### HIPAA Features
- **PHI Redaction**: Automatic sensitive data masking
- **Audit Logging**: Complete activity tracking
- **Access Controls**: Role-based data access
- **Secure Transport**: HTTPS enforcement
- **Data Minimization**: Scope-based data filtering

### Integration Points
- **EHR Systems**: Modular adapter pattern
- **Clearinghouses**: EDI processing support
- **Payer APIs**: Multi-payer integration ready
- **Analytics**: Power BI/Tableau compatible

## 🧪 React Frontend Integration

### Example: Fetching Denials
```typescript
// React component example
const [denials, setDenials] = useState([]);

useEffect(() => {
  fetch('/api/denials?category=authorization&limit=50', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(data => setDenials(data.data));
}, []);
```

### Example: Generating Appeals
```typescript
const generateAppeal = async (denialId: string) => {
  const response = await fetch('/api/appeals/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      denial_id: denialId,
      template_type: 'medical_necessity',
      include_clinical_notes: true
    })
  });
  
  const appeal = await response.json();
  return appeal.data;
};
```

## 🔧 Development

### Project Structure
```
src/
├── adapters/          # External system integrations
├── mcp/              # MCP tools and server
├── routes/           # REST API endpoints
├── types/            # TypeScript definitions
├── utils/            # Utilities (auth, logging, etc.)
└── server.ts         # Main server file
```

### Adding New MCP Tools
1. Create tool file in `src/mcp/tools/`
2. Define schema with Zod
3. Implement `run` function
4. Export tool from `mcpServer.ts`

### Adding New Adapters
1. Create adapter in `src/adapters/`
2. Implement interface methods
3. Add error handling and logging
4. Use in MCP tools or routes

## 📊 Monitoring & Logging

### Log Files
- `logs/error.log` - Error events
- `logs/audit.log` - HIPAA audit trail

### Health Check
- `GET /health` - Server status and metrics

### Monitoring Integration
Ready for APM tools like:
- New Relic
- DataDog  
- Application Insights

## 🚀 Deployment

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Configure real database connections
- [ ] Set up log rotation
- [ ] Enable HTTPS
- [ ] Configure monitoring
- [ ] Set up backup systems
- [ ] Review security headers

### Docker Support (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Add proper error handling
3. Include audit logging for sensitive operations
4. Write tests for new functionality
5. Update documentation

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For technical support or integration questions:
- Check the API documentation above
- Review the example implementations
- Ensure proper authentication setup
- Verify required scopes for operations

This server provides a solid foundation for healthcare RCM operations while maintaining HIPAA compliance and supporting both traditional web applications and modern AI-powered workflows.