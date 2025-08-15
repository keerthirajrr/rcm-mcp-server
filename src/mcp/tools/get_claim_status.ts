import { z } from 'zod';
import { ehrAdapter } from '../../adapters/ehrAdapter';
import { MCPContext, ClaimStatusSchema } from '../../types';
import { auditLog } from '../../utils/logger';

export const name = 'get_claim_status';
export const description = 'Fetch detailed claim status information from EHR/Clearinghouse';
export const inputSchema = ClaimStatusSchema;

export async function run(
  input: z.infer<typeof ClaimStatusSchema>, 
  ctx: MCPContext
) {
  // Require appropriate scope
  ctx.auth.requireScope('rcm.claim.read');

  auditLog('get_claim_status', ctx.auth.user_id, 'claim', input.claim_id, {
    include_history: input.include_history
  });

  try {
    const claimStatus = await ehrAdapter.getClaimStatus(
      input.claim_id, 
      input.include_history
    );

    // Apply PHI redaction based on user permissions
    const redactedData = ctx.redact(claimStatus);

    ctx.logger.info('Retrieved claim status', {
      claim_id: input.claim_id,
      status: claimStatus.status,
      user_id: ctx.auth.user_id
    });

    return {
      success: true,
      data: redactedData,
      metadata: {
        retrieved_at: new Date().toISOString(),
        includes_history: input.include_history
      }
    };
  } catch (error) {
    ctx.logger.error('Failed to retrieve claim status', {
      claim_id: input.claim_id,
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: ctx.auth.user_id
    });

    return {
      success: false,
      error: 'Failed to retrieve claim status',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }
}