/** Error yang aman ditampilkan ke pengguna (status 4xx). */
export class AppError extends Error {
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const sendSuccess = (res, { data = null, message = 'Berhasil', statusCode = 200, meta } = {}) => {
  const body = { status: 'success', message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};
