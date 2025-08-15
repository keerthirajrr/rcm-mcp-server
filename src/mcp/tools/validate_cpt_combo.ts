import { z } from 'zod';
import { clearinghouseAdapter } from '../../adapters/clearinghouseAdapter';
import { MCPContext, CPTValidationSchema } from '../../types';
import { auditLog } from '../../utils/logger';

export const name = 'validate_cpt_combo';
export const description = 'Validate CPT and ICD code combinations for billing accuracy';
export const inputSchema = CPTValidationSchema;

export async function run(
  input: z.infer<typeof CPTValidationSchema>, 
  ctx: MCPContext
) {
  ctx.auth.requireScope('rcm.claim.read');

  auditLog('validate_cpt_combo', ctx.auth.user_id, 'validation', 'cpt_combo', {
    cpt_codes: input.cpt_codes,
    icd_codes: input.icd_codes
  });

  try {
    const validation = await clearinghouseAdapter.validateCPTCombination(
      input.cpt_codes,
      input.icd_codes,
      {
        age: input.patient_age,
        gender: input.patient_gender
      }
    );

    ctx.logger.info('CPT combination validated', {
      cpt_codes: input.cpt_codes,
      valid: validation.valid,
      warnings_count: validation.warnings.length,
      user_id: ctx.auth.user_id
    });

    return {
      success: true,
      data: {
        valid: validation.valid,
        warnings: validation.warnings,
        recommendations: validation.recommendations,
        codes_analyzed: {
          cpt: input.cpt_codes,
          icd: input.icd_codes
        }
      },
      metadata: {
        validated_at: new Date().toISOString(),
        validation_rules_version: '1.0'
      }
    };
  } catch (error) {
    ctx.logger.error('Failed to validate CPT combination', {
      cpt_codes: input.cpt_codes,
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: ctx.auth.user_id
    });

    return {
      success: false,
      error: 'Failed to validate CPT combination',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }
}