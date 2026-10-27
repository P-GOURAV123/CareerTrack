const { body } = require('express-validator');

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

module.exports = {
  registerValidation,
  loginValidation,
};
