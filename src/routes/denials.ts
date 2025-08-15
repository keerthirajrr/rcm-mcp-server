import { Router } from 'express';
import { z } from 'zod';
import { AuthRequest, requireScope } from '../utils/auth';
import { payerAdapter } from '../adapters/payerAdapter';
import { createRedactionContext } from '../utils/redact';
import { auditLog, logger } from '../utils/logger';
import { DenialListSchema } from '../types';

const router = Router();

// GET /api/denials
router.get('/', requireScope('rcm.denial.read'), async (req: AuthRequest, res) => {
  try {
    const criteria = DenialListSchema.parse({
      ...req.query,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined
    });

    auditLog('get_denials_via_api', req.user!.user_id, 'denials', 'list', { criteria });

    const denials = await payerAdapter.getDenials(criteria);
    const redact = createRedactionContext(req.user!.scopes);

    // Calculate analytics
    const totalAmount = denials.reduce((sum, d) => sum + d.amount, 0);
    const categoryBreakdown = denials.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: denials.map(redact),
      analytics: {
        total_amount: totalAmount,
        category_breakdown: categoryBreakdown,
        average_denial_amount: denials.length > 0 ? totalAmount / denials.length : 0,
        appealable_count: denials.filter(d => d.can_appeal).length
      },
      pagination: {
        limit: criteria.limit,
        offset: criteria.offset,
        total: denials.length
      },
      metadata: {
        retrieved_at: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    }

    logger.error('Failed to retrieve denials', {
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: req.user?.user_id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve denials'
    });
  }
});

// GET /api/denials/:id/analyze
router.get('/:id/analyze', requireScope('rcm.denial.read'), async (req: AuthRequest, res) => {
  try {
    const denialId = req.params.id;

    auditLog('analyze_denial_via_api', req.user!.user_id, 'denial', denialId);

    const analysis = await payerAdapter.analyzeDenialRootCause(denialId);
    
    res.json({
      success: true,
      data: {
        denial_id: denialId,
        ...analysis,
        analyzed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to analyze denial', {
      denial_id: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: req.user?.user_id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to analyze denial'
    });
  }
});

export default router;