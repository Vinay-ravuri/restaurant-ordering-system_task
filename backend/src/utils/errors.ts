import { ZodError } from 'zod';

export interface ApiErrorResponse {
  error: string;
  fields?: Record<string, string>;
}

export function formatZodError(error: ZodError): ApiErrorResponse {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!fields[path]) {
      fields[path] = issue.message;
    }
  }
  return {
    error: 'Validation failed',
    fields,
  };
}

export class AppError extends Error {
  public statusCode: number;
  public fields?: Record<string, string>;

  constructor(message: string, statusCode = 400, fields?: Record<string, string>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.fields = fields;
  }
}
