import { logger } from './logger';

// HIPAA-compliant data redaction
export interface RedactionOptions {
  level: 'full' | 'partial' | 'none';
  preserveStructure: boolean;
}

const SENSITIVE_FIELDS = [
  'patient_name', 'patient_ssn', 'patient_dob', 'patient_address',
  'patient_phone', 'patient_email', 'subscriber_name', 'subscriber_ssn'
];

const PARTIAL_REDACT_FIELDS = [
  'patient_id', 'subscriber_id', 'claim_id'
];

export function redactPHI(data: any, options: RedactionOptions = { level: 'full', preserveStructure: true }): any {
  if (!data) return data;

  if (options.level === 'none') {
    return data;
  }

  // Deep clone to avoid mutating original data
  const redacted = JSON.parse(JSON.stringify(data));

  function redactValue(obj: any, key: string, value: any): any {
    if (SENSITIVE_FIELDS.includes(key)) {
      if (options.level === 'full') {
        return options.preserveStructure ? '[REDACTED]' : undefined;
      }
      return partialRedact(value);
    }

    if (PARTIAL_REDACT_FIELDS.includes(key) && options.level === 'full') {
      return partialRedact(value);
    }

    return value;
  }

  function traverse(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(traverse);
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = redactValue(obj, key, traverse(value));
      }
      return result;
    }

    return obj;
  }

  const result = traverse(redacted);
  
  // Log redaction for audit trail (without including sensitive data)
  logger.info('PHI redaction applied', {
    level: options.level,
    fields_processed: Object.keys(data).length,
    timestamp: new Date().toISOString()
  });

  return result;
}

function partialRedact(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  if (value.length <= 4) {
    return '***';
  }
  
  // Show first 2 and last 2 characters
  const start = value.substring(0, 2);
  const end = value.substring(value.length - 2);
  const middle = '*'.repeat(Math.max(0, value.length - 4));
  
  return `${start}${middle}${end}`;
}

export function createRedactionContext(userScopes: string[]) {
  const level: RedactionOptions['level'] = userScopes.includes('rcm.patient.read') ? 'partial' : 'full';
  
  return (data: any) => redactPHI(data, { level, preserveStructure: true });
}