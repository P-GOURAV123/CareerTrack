const { body } = require('express-validator');

const applicationValidation = [
  body('companyName').trim().notEmpty().isLength({ max: 120 }).withMessage('Company name is required and must be 120 characters or fewer.'),
  body('jobTitle').trim().notEmpty().isLength({ max: 120 }).withMessage('Job title is required and must be 120 characters or fewer.'),
  body('jobType').optional().isIn(['Internship', 'Full-time', 'Part-time', 'Contract']),
  body('applicationSource')
    .optional()
    .isIn(['Company website', 'LinkedIn', 'Referral', 'Job board', 'Recruiter', 'Career fair', 'Other']),
  body('location').optional().trim().isLength({ max: 100 }),
  body('salary').optional().trim().isLength({ max: 80 }),
  body('workArrangement').optional().isIn(['On-site', 'Remote', 'Hybrid']),
  body('recruiterName').optional().trim().isLength({ max: 80 }),
  body('recruiterContact').optional().trim().isLength({ max: 120 }),
  body('interviewDetails').optional().trim().isLength({ max: 500 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('currentStatus').optional().isIn(['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn']),
  body('applicationDate').isISO8601().withMessage('Application date must be a valid date.'),
  body('followUpDate').optional({ checkFalsy: true }).isISO8601().withMessage('Follow-up date must be a valid date.'),
  body('interviewDate').optional({ checkFalsy: true }).isISO8601().withMessage('Interview date must be a valid date.'),
];

module.exports = {
  applicationValidation,
};
