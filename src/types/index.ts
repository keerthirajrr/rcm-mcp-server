import { z } from 'zod';

// Core RCM Types
export interface ClaimStatus {
  claim_id: string;
  patient_id: string;
  patient_name?: string; // Redacted in production
  status: 'submitted' | 'pending' | 'paid' | 'denied' | 'appealed' | 'voided';
  payer: string;
  amount: number;
  date_submitted: string;
  date_updated: string;
  denial_reason?: string;
  denial_code?: string;
  history?: ClaimStatusHistory[];
}

export interface ClaimStatusHistory {
  date: string;
  status: string;
  description: string;
  amount?: number;
}

export interface Denial {
  denial_id: string;
  claim_id: string;
  patient_id: string;
  denial_date: string;
  denial_code: string;
  denial_reason: string;
  category: 'authorization' | 'eligibility' | 'coding' | 'documentation' | 'medical_necessity' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  amount: number;
  payer: string;
  cpt_codes: string[];
  icd_codes: string[];
  can_appeal: boolean;
  appeal_deadline?: string;
  root_cause?: string;
}

export interface Appeal {
  appeal_id: string;
  claim_id: string;
  denial_id: string;
  appeal_date: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  letter_content?: string;
  supporting_docs: string[];
  reviewer: string;
}

// MCP Context
export interface MCPContext {
  auth: {
    user_id: string;
    scopes: string[];
    requireScope: (scope: string) => void;
  };
  redact: (data: any) => any;
  logger: any;
}

// Validation Schemas
export const ClaimStatusSchema = z.object({
  claim_id: z.string(),
  include_history: z.boolean().default(false)
});

export const DenialListSchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  payer: z.string().optional(),
  category: z.enum(['authorization', 'eligibility', 'coding', 'documentation', 'medical_necessity', 'other']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
});

export const AppealGenerationSchema = z.object({
  denial_id: z.string(),
  template_type: z.enum(['standard', 'medical_necessity', 'authorization', 'coding']).default('standard'),
  include_clinical_notes: z.boolean().default(false)
});

export const CPTValidationSchema = z.object({
  cpt_codes: z.array(z.string()),
  icd_codes: z.array(z.string()),
  patient_age: z.number().optional(),
  patient_gender: z.enum(['M', 'F', 'O']).optional()
});