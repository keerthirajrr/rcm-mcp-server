import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from './utils/auth';
import { handleMCPRequest } from './mcp/mcpServer';
import { logger } from './utils/logger';

// Route imports
import authRouter from './routes/auth';
import claimsRouter from './routes/claims';
import denialsRouter from './routes/denials';
import appealsRouter from './routes/appeals';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Authentication routes (public)
app.use('/api/auth', authRouter);

// Protected API routes
app.use('/api/claims', authenticateToken, claimsRouter);
app.use('/api/denials', authenticateToken, denialsRouter);
app.use('/api/appeals', authenticateToken, appealsRouter);

// MCP endpoint (protected)
app.post('/mcp', authenticateToken, handleMCPRequest);

// MCP capabilities endpoint
app.get('/mcp/capabilities', (req, res) => {
  res.json({
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
    implementation: {
      name: 'RCM MCP Server',
      version: '1.0.0'
    },
    protocol_version: '2024-11-05'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'POST /api/auth/login',
      'GET /api/claims',
      'GET /api/denials',
      'POST /api/appeals/generate',
      'POST /mcp'
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 RCM MCP Server running on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔒 Authentication required for protected endpoints`);
  logger.info(`🤖 MCP endpoint available at http://localhost:${PORT}/mcp`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

export default app;