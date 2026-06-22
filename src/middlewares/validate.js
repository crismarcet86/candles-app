const { validationResult } = require('express-validator');
const { badRequest } = require('../utils/response');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest(res, 'Error de validación', errors.array());
  }
  next();
};
