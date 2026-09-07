/**
 * apiError.ts — Custom Error class untuk penanganan HTTP API (Pola Komiku).
 * Membawa HTTP status, error code opsional dari server, dan pesan ramah pengguna.
 */

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
