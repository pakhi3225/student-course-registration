const { validationResult } = require('express-validator');

// Runs after the rule chains: if anything failed, stop and reply 422 with field errors.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  result.array().forEach((e) => {
    if (!errors[e.path]) errors[e.path] = e.msg; // keep the first error per field
  });

  return res.status(422).json({ success: false, message: 'Validation failed', errors });
};
