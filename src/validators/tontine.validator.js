import Joi from 'joi';

export const createTontineSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),
  frequency: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Frequency must be a number',
      'number.integer': 'Frequency must be an integer',
      'number.min': 'Frequency must be at least 1 day',
      'any.required': 'Frequency is required'
    }),
  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'any.required': 'Start date is required'
    })
});

export const paymentSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    })
});
