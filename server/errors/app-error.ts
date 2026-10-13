import "server-only";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  readonly fields?: Record<string, string[]>;

  constructor(message = "Validasi data gagal", fields?: Record<string, string[]>) {
    super(message, 422, "VALIDATION_ERROR");
    this.fields = fields;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Data tidak ditemukan") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Data bertentangan dengan data yang sudah ada") {
    super(message, 409, "CONFLICT");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sesi admin tidak valid atau belum masuk") {
    super(message, 401, "UNAUTHORIZED");
  }
}
