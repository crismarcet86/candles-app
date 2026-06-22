/**
 * Respuestas HTTP estandarizadas.
 * Formato: { ok, message, data?, errors? }
 */

const success = (res, data, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ ok: true, message, data });

const created = (res, data, message = 'Creado exitosamente') =>
  success(res, data, message, 201);

const error = (res, message = 'Error interno', statusCode = 500, errors = null) =>
  res.status(statusCode).json({ ok: false, message, ...(errors && { errors }) });

const notFound = (res, message = 'Recurso no encontrado') =>
  error(res, message, 404);

const badRequest = (res, message = 'Solicitud inválida', errors = null) =>
  error(res, message, 400, errors);

module.exports = { success, created, error, notFound, badRequest };
