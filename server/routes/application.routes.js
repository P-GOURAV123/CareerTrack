const express = require('express');
const protect = require('../middleware/auth');
const { applicationValidation } = require('../validators/application.validator');
const handleValidation = require('../utils/handleValidation');
const {
  createApplication,
  getApplications,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');

const router = express.Router();

router.use(protect);
router.get('/', getApplications);
router.post('/', applicationValidation, handleValidation, createApplication);
router.put('/:id', applicationValidation, handleValidation, updateApplication);
router.delete('/:id', deleteApplication);

module.exports = router;
