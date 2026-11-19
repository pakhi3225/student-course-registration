const { body, param, query } = require('express-validator');
const catalog = require('../catalog');
const store = require('../store');

const MAX_COURSES_PER_STUDENT = 3;
const departments = Object.keys(catalog);
const allCourses = Object.values(catalog).flat();

// Helper: PRN as the sanitizer would have normalised it
const normPrn = (v) => String(v || '').trim();

const registrationRules = [
  body('studentName')
    .trim()
    .notEmpty().withMessage('Student name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Name must be 3-50 characters')
    .matches(/^[A-Za-z\s.'-]+$/).withMessage("Name can contain only letters, spaces, . ' -"),

  body('prn')
    .trim()
    .notEmpty().withMessage('PRN is required')
    .matches(/^\d{12}$/).withMessage('PRN must be exactly 12 digits (e.g. 202101234567)'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),

  body('dob')
    .trim()
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601({ strict: true, strictSeparator: true }).withMessage('Enter a valid date (YYYY-MM-DD)')
    .bail()
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (dob > today) throw new Error('Date of birth cannot be in the future');
      if (age < 16 || age > 40) throw new Error('Student age must be between 16 and 40 years');
      return true;
    }),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required')
    .isIn(departments).withMessage('Select a valid department'),

  body('year')
    .notEmpty().withMessage('Year of study is required')
    .isInt({ min: 1, max: 4 }).withMessage('Year must be 1, 2, 3 or 4')
    .toInt(),

  body('course')
    .trim()
    .notEmpty().withMessage('Course is required')
    .isIn(allCourses).withMessage('Select a valid course')
    .bail()
    // Cross-field rule: the course must be offered by the chosen department
    .custom((value, { req }) => {
      const offered = catalog[req.body.department];
      if (offered && !offered.includes(value)) {
        throw new Error(`"${value}" is not offered by the ${req.body.department} department`);
      }
      return true;
    })
    // Business rules backed by the JSON file
    .custom((value, { req }) => {
      const prn = normPrn(req.body.prn);
      if (!prn) return true;
      if (store.hasCourse(prn, value)) {
        throw new Error('This student is already registered for this course');
      }
      if (store.countByPrn(prn) >= MAX_COURSES_PER_STUDENT) {
        throw new Error(`A student can register for at most ${MAX_COURSES_PER_STUDENT} courses`);
      }
      return true;
    }),

  body('rating')
    .notEmpty().withMessage('Please rate the course')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be a whole number from 1 to 5')
    .toInt(),

  body('feedback')
    .trim()
    .notEmpty().withMessage('Feedback is required')
    .isLength({ min: 10, max: 300 }).withMessage('Feedback must be 10-300 characters')
    .not().matches(/[<>]/).withMessage('Feedback must not contain < or > characters'),

  body('declaration')
    .custom((v) => v === true || v === 'true' || v === 'on')
    .withMessage('You must confirm the declaration'),
];

// Validate route parameter: /api/registrations/:id
const idRule = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer').toInt(),
];

// Validate query string: /api/registrations?department=Civil
const queryRules = [
  query('department').optional().isIn(departments).withMessage('Unknown department'),
];

module.exports = { registrationRules, idRule, queryRules, MAX_COURSES_PER_STUDENT };
