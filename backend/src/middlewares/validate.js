import { AppError } from '../utils/response.js';

/**
 * Validasi request dengan skema Joi.
 * @param {import('joi').Schema} schema
 * @param {'body'|'query'|'params'} source
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const { value, error } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    throw new AppError(400, errors[0]?.message || 'Data yang dikirim tidak valid.', errors);
  }

  // Express 5: req.query adalah getter, jadi hasil validasi disimpan di req.validated
  req.validated = { ...(req.validated || {}), [source]: value };
  next();
};
