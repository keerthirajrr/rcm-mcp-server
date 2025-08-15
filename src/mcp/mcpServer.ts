import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../utils/auth';
import { createRedactionContext } from '../utils/redact';
import { logger } from '../utils/logger';

// Import all MCP tools
import * as getClaimStatus from './tools/get_claim_status';
import * as listDenials from './tools/list_denials';
import * as validateCptCombo from './tools/validate_cpt_combo';
import * as analyzeDenialRootCause from './tools/analyze_denial_root_cause';
import * as generateAppealLetter from './tools/generate_appeal_letter';

// Define the tool interface
interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  run: (input: any, ctx: any) => Promise<any>;
}

// Create tools object with proper typing
const tools: Record<string, MCPTool> = {
  [getClaimStatus.name]: getClaimStatus,
  [listDenials.name]: listDenials,
  [validateCptCombo.name]: validateCptCombo,
  [analyzeDenialRootCause.name]: analyzeDenialRootCause,
  [generateAppealLetter.name]: generateAppealLetter
};

const MCPRequestSchema = z.object({
  method: z.enum(['list_tools', 'call_tool']),
  params: z.object({
    name: z.string().optional(),
    arguments: z.any().optional()
  }).optional()
});

export async function handleMCPRequest(req: AuthRequest, res: Response) {
  try {
    const { method, params } = MCPRequestSchema.parse(req.body);

    switch (method) {
      case 'list_tools':
        return res.json({
          tools: Object.entries(tools).map(([name, tool]) => ({
            name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        });

      case 'call_tool':
        if (!params?.name || !tools[params.name]) {
          return res.status(400).json({ error: 'Invalid or missing tool name' });
        }

        const tool = tools[params.name];
        
        // Validate input against tool schema
        const validatedInput = tool.inputSchema.parse(params.arguments || {});

        // Create MCP context
        const ctx = {
          auth: {
            user_id: req.user!.user_id,
            scopes: req.user!.scopes,
            requireScope: (scope: string) => {
              if (!req.user!.scopes.includes(scope)) {
                throw new Error(`Insufficient permissions. Required scope: ${scope}`);
              }
            }
          },
          redact: createRedactionContext(req.user!.scopes),
          logger
        };

        // Execute tool
        const result = await tool.run(validatedInput, ctx);
        
        return res.json({ result });

      default:
        return res.status(400).json({ error: 'Unsupported method' });
    }
  } catch (error) {
    logger.error('MCP request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: req.user?.user_id,
      method: req.body?.method
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input parameters',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}