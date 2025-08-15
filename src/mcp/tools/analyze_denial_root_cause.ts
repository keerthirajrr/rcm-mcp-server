import { z } from 'zod';
import { payerAdapter } from '../../adapters/payerAdapter';
import { MCPContext } from '../../types';
import { auditLog } from '../../utils/logger';

export const name = 'analyze_denial_root_cause';
export const description = 'AI-powered analysis of denial patterns and root causes';

export const inputSchema = z.object({
  denial_id: z.string(),
  include_recommendations: z.boolean().default(true)
});

export async function run(
  input: z.infer<typeof inputSchema>, 
  ctx: MCPContext
) {
  ctx.auth.requireScope('rcm.denial.read');

  auditLog('analyze_denial_root_cause', ctx.auth.user_id, 'denial', input.denial_id, {
    include_recommendations: input.include_recommendations
  });

  try {
    const analysis = await payerAdapter.analyzeDenialRootCause(input.denial_id);

    ctx.logger.info('Denial root cause analyzed', {
      denial_id: input.denial_id,
      root_cause: analysis.root_cause,
      recommendations_count: analysis.recommendations.length,
      user_id: ctx.auth.user_id
    });

    return {
      success: true,
      data: {
        denial_id: input.denial_id,
        root_cause: analysis.root_cause,
        recommendations: input.include_recommendations ? analysis.recommendations : [],
        confidence_score: Math.random() * 0.3 + 0.7, // Mock confidence score
        analysis_method: 'pattern_matching_ai'
      },
      metadata: {
        analyzed_at: new Date().toISOString(),
        model_version: 'denial-analyzer-v1.2'
      }
    };
  } catch (error) {
    ctx.logger.error('Failed to analyze denial root cause', {
      denial_id: input.denial_id,
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: ctx.auth.user_id
    });

    return {
      success: false,
      error: 'Failed to analyze denial root cause',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }
}