// src/utils/validators.js
const Joi = require('joi');

/**
 * Validation schemas
 */

const nameRegex = /^[A-Za-z]{2,}$/;

const registerSchema = Joi.object({
  firstName: Joi.string().pattern(nameRegex).min(2).required().messages({
    'string.pattern.base': 'First name must contain only letters and be at least 2 characters',
    'string.min': 'First name must be at least 2 characters long'
  }),
  lastName: Joi.string().pattern(nameRegex).min(2).required().messages({
    'string.pattern.base': 'Last name must contain only letters and be at least 2 characters',
    'string.min': 'Last name must be at least 2 characters long'
  }),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Password must include uppercase, lowercase and a number',
    }),
  confirmPassword: Joi.any().valid(Joi.ref('password')).when('password', { is: Joi.exist(), then: Joi.required() }).messages({
    'any.only': 'Passwords do not match'
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must include uppercase, lowercase and a number',
    }),
});

const otpSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  otp: Joi.string().length(6).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

/**
 * Middleware factory for validation
 */
function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      console.error("Joi validation error:", error.details);
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
  validateBody,
};
