# Contributing to RCM MCP Server

We love your input! We want to make contributing to the RCM MCP Server as easy and transparent as possible.

## Development Process

We use GitHub to sync code, track issues, feature requests, and accept pull requests.

## Pull Request Process

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing style
6. Issue that pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/rcm-mcp-server.git
cd rcm-mcp-server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Start development server
npm run dev
```

## Code Style

- Use TypeScript strict mode
- Follow existing ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Maintain consistent indentation (2 spaces)

## Testing

```bash
# Run all tests
npm test

# Run linter
npm run lint

# Build project
npm run build

# Test server manually
npm start
# In another terminal:
curl http://localhost:4000/health
```

## Healthcare Compliance Guidelines

When contributing to healthcare-related features:

### HIPAA Compliance
- Never log PHI (Protected Health Information) in plain text
- Use the redaction utilities for sensitive data
- Add audit logging for all data access
- Follow the principle of minimum necessary access

### Code Examples
```typescript
// ✅ Good - Using redaction
const redactedData = ctx.redact(patientData);
ctx.logger.info('Retrieved patient data', { 
  patient_id: redactedData.patient_id 
});

// ❌ Bad - Logging PHI
ctx.logger.info('Patient data', patientData);
```

## MCP Tool Development

When adding new MCP tools:

1. **Create the tool file** in `src/mcp/tools/`
2. **Define the schema** using Zod
3. **Implement the run function**
4. **Add proper error handling**
5. **Include audit logging**
6. **Export from mcpServer.ts**

### Template for New MCP Tools

```typescript
import { z } from 'zod';
import { MCPContext } from '../../types';
import { auditLog } from '../../utils/logger';

export const name = 'your_tool_name';
export const description = 'Description of what this tool does';

export const inputSchema = z.object({
  // Define your input schema
});

export async function run(
  input: z.infer<typeof inputSchema>, 
  ctx: MCPContext
) {
  // Require appropriate scope
  ctx.auth.requireScope('required.scope');

  // Audit log the operation
  auditLog(name, ctx.auth.user_id, 'resource_type', 'resource_id', input);

  try {
    // Your tool logic here
    const result = await someOperation(input);
    
    // Apply PHI redaction
    const redactedResult = ctx.redact(result);

    ctx.logger.info('Tool executed successfully', {
      tool: name,
      user_id: ctx.auth.user_id
    });

    return {
      success: true,
      data: redactedResult
    };
  } catch (error) {
    ctx.logger.error('Tool execution failed', {
      tool: name,
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: ctx.auth.user_id
    });

    return {
      success: false,
      error: 'Tool execution failed'
    };
  }
}
```

## Adapter Development

When adding new external system adapters:

1. **Implement the adapter interface**
2. **Add proper error handling and retries**
3. **Include connection pooling for production**
4. **Add comprehensive logging**
5. **Handle authentication securely**

## Documentation

- Update README.md for user-facing changes
- Update DOCUMENTATION.md for comprehensive features
- Add JSDoc comments for public APIs
- Update ARCHITECTURE.md for architectural changes

## Commit Message Convention

We use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat(mcp): add new claim validation tool
fix(auth): resolve JWT token expiration issue
docs: update API documentation for new endpoints
```

## Issue Reporting

We use GitHub issues to track public bugs and feature requests:

- **Bug reports**: Use the bug report template
- **Feature requests**: Use the feature request template
- **Security issues**: Email security concerns privately

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

## Healthcare Integration Guidelines

When integrating with healthcare systems:

### EHR Integration
- Use FHIR standards when possible
- Handle HL7 messages appropriately  
- Implement proper patient matching
- Follow data synchronization patterns

### Clearinghouse Integration
- Support EDI X12 standards (837, 835, 270/271, 276/277)
- Handle batch processing efficiently
- Implement proper error handling for rejections
- Support real-time and batch submissions

### Payer Integration
- Handle payer-specific API differences
- Implement proper rate limiting
- Cache eligibility responses appropriately
- Handle authentication token refresh

## Security Best Practices

- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper input validation
- Follow OWASP security guidelines
- Regular dependency updates
- Security testing in CI/CD

Thank you for contributing to healthcare technology! 🏥
