# 🏗️ RCM MCP Server - Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Applications                          │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│  React Frontend │   AI Agents     │    Mobile Apps                  │
│  (Dashboard)    │  (GPT, Claude)  │   (iOS, Android)                │
└─────────┬───────┴─────────┬───────┴─────────┬───────────────────────┘
          │                 │                 │
          │ REST API        │ MCP Protocol    │ REST API
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────────────┐
│                    RCM MCP SERVER                                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Express.js Application                    │    │
│  │                                                             │    │
│  │  ┌─────────────────┐              ┌─────────────────┐       │    │
│  │  │  REST API       │              │  MCP Handler    │       │    │
│  │  │  Endpoints      │              │  (Protocol)     │       │    │
│  │  │                 │              │                 │       │    │
│  │  │ • /health       │              │ • list_tools    │       │    │
│  │  │ • /auth/login   │              │ • call_tool     │       │    │
│  │  │ • /api/claims   │              │ • capabilities  │       │    │
│  │  │ • /api/denials  │              │                 │       │    │
│  │  │ • /api/appeals  │              │                 │       │    │
│  │  └─────────────────┘              └─────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Middleware Layer                         │    │
│  │                                                             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐    │    │
│  │  │  Auth    │ │   CORS   │ │  Helmet  │ │ Rate Limit  │    │    │
│  │  │   JWT    │ │ Origins  │ │ Security │ │   100/15m   │    │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘    │    │
│  │                                                             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐    │    │
│  │  │   Zod    │ │ Winston  │ │   PHI    │ │    Audit    │    │    │
│  │  │Validation│ │ Logging  │ │Redaction │ │   Logging   │    │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Business Logic Layer                      │    │
│  │                                                             │    │
│  │           ┌─────────────────────────────────────┐           │    │
│  │           │            MCP Tools                │           │    │
│  │           │                                     │           │    │
│  │           │  ┌─────────────────────────────┐    │           │    │
│  │           │  │   get_claim_status          │    │           │    │
│  │           │  │   • Fetch from EHR          │    │           │    │
│  │           │  │   • Historical tracking     │    │           │    │
│  │           │  │   • Status validation       │    │           │    │
│  │           │  └─────────────────────────────┘    │           │    │
│  │           │                                     │           │    │
│  │           │  ┌─────────────────────────────┐    │           │    │
│  │           │  │   list_denials              │    │           │    │
│  │           │  │   • Filter & paginate       │    │           │    │
│  │           │  │   • Category analysis       │    │           │    │
│  │           │  │   • Severity assessment     │    │           │    │
│  │           │  └─────────────────────────────┘    │           │    │
│  │           │                                     │           │    │
│  │           │  ┌─────────────────────────────┐    │           │    │
│  │           │  │   validate_cpt_combo        │    │           │    │
│  │           │  │   • CPT/ICD validation      │    │           │    │
│  │           │  │   • Age/gender checks       │    │           │    │
│  │           │  │   • Medical necessity       │    │           │    │
│  │           │  └─────────────────────────────┘    │           │    │
│  │           │                                     │           │    │
│  │           │  ┌─────────────────────────────┐    │           │    │
│  │           │  │   analyze_denial_root_cause │    │           │    │
│  │           │  │   • AI-powered analysis     │    │           │    │
│  │           │  │   • Pattern recognition     │    │           │    │
│  │           │  │   • Actionable insights     │    │           │    │
│  │           │  └─────────────────────────────┘    │           │    │
│  │           │                                     │           │    │
│  │           │  ┌─────────────────────────────┐    │           │    │
│  │           │  │   generate_appeal_letter    │    │           │    │
│  │           │  │   • Template selection      │    │           │    │
│  │           │  │   • Clinical integration    │    │           │    │
│  │           │  │   • Payer-specific format   │    │           │    │
│  │           │  └─────────────────────────────┘    │           │    │
│  │           └─────────────────────────────────────┘           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Adapter Layer                            │    │
│  │                                                             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │    │
│  │  │     EHR     │  │Clearinghouse│  │    Payer    │         │    │
│  │  │   Adapter   │  │   Adapter   │  │   Adapter   │         │    │
│  │  │             │  │             │  │             │         │    │
│  │  │• Epic       │  │• Change     │  │• Anthem     │         │    │
│  │  │• Cerner     │  │  Healthcare │  │• Aetna      │         │    │
│  │  │• Allscripts │  │• Availity   │  │• BCBS       │         │    │
│  │  │• Custom     │  │• Relay      │  │• Medicare   │         │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     External Systems                                │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐    │
│  │     EHR     │  │Clearinghouse│  │   Payers    │  │Database  │    │
│  │   Systems   │  │   Systems   │  │  (Insurance)│  │ Systems  │    │
│  │             │  │             │  │             │  │          │    │
│  │• Patient    │  │• Claims     │  │• Eligibility│  │• MongoDB │    │
│  │  Records    │  │  Submission │  │• Prior Auth │  │• MySQL   │    │
│  │• Billing    │  │• Status     │  │• Appeals    │  │• Redis   │    │
│  │  Data       │  │  Tracking   │  │• Payments   │  │• Backup  │    │
│  │• Clinical   │  │• EDI Trans. │  │• Policies   │  │  Storage │    │
│  │  Notes      │  │• Batch Proc │  │• Updates    │  │          │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### 1. Request Processing Flow
```
Client Request → Express Middleware → Authentication → Authorization → 
Business Logic → Adapter Layer → External Systems → Response Processing → 
Security Filtering → Client Response
```

### 2. MCP Tool Execution Flow
```
MCP Request → Tool Discovery → Schema Validation → Context Creation → 
Tool Execution → External API Call → Data Processing → PHI Redaction → 
Audit Logging → MCP Response
```

### 3. Security Flow
```
JWT Token → Scope Verification → PHI Access Check → Data Filtering → 
Audit Trail → Secure Response
```

## Component Architecture

### Core Components

#### 1. **Express Server (`server.ts`)**
- Main application entry point
- Middleware configuration
- Route registration
- Error handling
- Graceful shutdown

#### 2. **MCP Server (`mcp/mcpServer.ts`)**
- Model Context Protocol implementation
- Tool discovery and execution
- Context management
- Response formatting

#### 3. **Authentication System (`utils/auth.ts`)**
- JWT token generation/validation
- User session management
- Scope-based authorization
- Role-based access control

#### 4. **Adapter Pattern (`adapters/`)**
- External system abstraction
- Error handling standardization
- Connection management
- Data transformation

#### 5. **Security Layer (`utils/redact.ts`)**
- PHI data redaction
- Sensitive field masking
- Role-based filtering
- Compliance enforcement

#### 6. **Logging System (`utils/logger.ts`)**
- Structured logging
- Audit trail generation
- Error tracking
- Performance monitoring

## Technology Stack Deep Dive

### Backend Framework
```
Node.js 18+ (Runtime)
├── Express.js 4.18+ (Web Framework)
├── TypeScript 5.3+ (Type Safety)
└── TSX (Development Runtime)
```

### Security & Compliance
```
Helmet.js (Security Headers)
├── CORS (Cross-Origin Resource Sharing)
├── JWT (JSON Web Tokens)
├── bcryptjs (Password Hashing)
├── Rate Limiting (DDoS Protection)
└── PHI Redaction (HIPAA Compliance)
```

### Validation & Schema
```
Zod (Schema Validation)
├── Input Validation
├── Type Generation
├── Error Handling
└── API Documentation
```

### Logging & Monitoring
```
Winston (Structured Logging)
├── File Transport
├── Console Transport
├── Error Tracking
└── Audit Trails
```

### Development Tools
```
Jest (Testing Framework)
├── ESLint (Code Quality)
├── TypeScript Compiler
└── GitHub Actions (CI/CD)
```

## Deployment Architecture

### Development Environment
```
Local Machine
├── npm run dev (TSX Watch Mode)
├── Hot Reload
├── Debug Logging
└── Mock External Systems
```

### Production Environment
```
Cloud Platform (AWS/Azure/GCP)
├── Load Balancer
├── Auto Scaling
├── Database Cluster
├── Redis Cache
├── Monitoring Stack
└── Backup Systems
```

### Security Considerations
```
Network Security
├── VPC/Private Networks
├── SSL/TLS Termination
├── WAF (Web Application Firewall)
└── DDoS Protection

Data Security
├── Encryption at Rest
├── Encryption in Transit
├── Key Management
└── Access Auditing

Compliance
├── HIPAA Compliance
├── SOC 2 Type II
├── Data Retention Policies
└── Incident Response
```

## Performance Characteristics

### Expected Metrics
- **Response Time**: < 200ms (95th percentile)
- **Throughput**: 1000+ requests/minute
- **Availability**: 99.9% uptime SLA
- **Error Rate**: < 0.1%

### Scalability Patterns
- Horizontal scaling with load balancers
- Database read replicas
- Caching layers (Redis)
- Async processing queues
- CDN for static assets

## Integration Patterns

### EHR Integration
```
FHIR Standards
├── Patient Resources
├── Claim Resources
├── Coverage Resources
└── ExplanationOfBenefit
```

### Clearinghouse Integration
```
EDI Standards
├── 837 (Claims)
├── 835 (Remittance)
├── 270/271 (Eligibility)
└── 276/277 (Claim Status)
```

### Payer Integration
```
Real-time APIs
├── Eligibility Verification
├── Prior Authorization
├── Claim Submission
└── Payment Processing
```

This architecture provides a robust, scalable, and compliant foundation for healthcare revenue cycle management with modern AI agent integration capabilities.
