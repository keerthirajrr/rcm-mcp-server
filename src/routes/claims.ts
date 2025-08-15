import { Router } from 'express';
import { z } from 'zod';
import { AuthRequest, requireScope } from '../utils/auth';
import { ehrAdapter } from '../adapters/ehrAdapter';
import { createRedactionContext } from '../utils/redact';
import { auditLog, logger } from '../utils/logger';

const router = Router();

// GET /api/claims/:id
router.get('/:id', requireScope('rcm.claim.read'), async (req: AuthRequest, res) => {
  try {
    const claimId = req.params.id;
    const includeHistory = req.query.include_history === 'true';

    auditLog('get_claim_via_api', req.user!.user_id, 'claim', claimId, {
      include_history: includeHistory
    });

    const claimStatus = await ehrAdapter.getClaimStatus(claimId, includeHistory);
    const redact = createRedactionContext(req.user!.scopes);
    
    res.json({
      success: true,
      data: redact(claimStatus),
      metadata: {
        retrieved_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve claim', {
      claim_id: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: req.user?.user_id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve claim'
    });
  }
});

// GET /api/claims
router.get('/', requireScope('rcm.claim.read'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      payer: z.string().optional(),
      status: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
      limit: z.string().transform(Number).pipe(z.number().min(1).max(1000)).default('100'),
      offset: z.string().transform(Number).pipe(z.number().min(0)).default('0')
    });

    const criteria = schema.parse(req.query);

    auditLog('search_claims_via_api', req.user!.user_id, 'claims', 'search', { criteria });

    const claims = await ehrAdapter.searchClaims(criteria);
    const redact = createRedactionContext(req.user!.scopes);
    
    res.json({
      success: true,
      data: claims.map(redact),
      pagination: {
        limit: criteria.limit,
        offset: criteria.offset,
        total: claims.length
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

    logger.error('Failed to search claims', {
      error: error instanceof Error ? error.message : 'Unknown error',
      user_id: req.user?.user_id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to search claims'
    });
  }
});

export default router;