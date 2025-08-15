import { z } from 'zod';
import { payerAdapter } from '../../adapters/payerAdapter';
import { MCPContext, DenialListSchema } from '../../types';
import { auditLog } from '../../utils/logger';

export const name = 'list_denials';
export const description = 'Retrieve and filter denial information with analytics';
export const inputSchema = DenialListSchema;

export async function run(
  input: z.infer<typeof DenialListSchema>, 
  ctx: MCPContext
) {
  ctx.auth.requireScope('rcm.denial.read');

  auditLog('list_denials', ctx.auth.user_id, 'denials', 'list', {
    filters: input,
    limit: input.limit,
    offset: input.offset
  });

  try {
    const denials = await payerAdapter.getDenials(input);
    const redactedDenials = denials.map(denial => ctx.redact(denial));

    // Calculate summary statistics
    const totalAmount = denials.reduce((sum, d) => sum + d.amount, 0);
    const categoryBreakdown = denials.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityBreakdown = denials.reduce((acc, d) => {
      acc[d.severity] = (acc[d.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    ctx.logger.info('Retrieved denial list', {
      count: denials.length,
      total_amount: totalAmount,
      user_id: ctx.auth.user_id
    });

    return {
      success: true,
      data: redactedDenials,
      summary: {
        total_count: denials.length,
        total_amount: totalAmount,
        category_breakdown: categoryBreakdown,
        severity_breakdown: severityBreakdown
      },
      pagination: {
        limit: input.limit,
        offset: input.offset,
        has_more: denials.length === input.limit // Simple check
      },
      metadata: {
        retrieved_at: new Date().toISOString(),
        filters_applied: Object.keys(input).filter(key => input[key as keyof typeof input] !== undefined)
      }
    };
  } catch (error) {
    ctx.logger.error('Failed to retrieve denials', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filters: input,
      user_id: ctx.auth.user_id
    });

    return {
      success: false,
      error: 'Failed to retrieve denials',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }
}