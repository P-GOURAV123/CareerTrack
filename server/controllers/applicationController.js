const { randomUUID } = require('crypto');
const store = require('../storage/jsonStore');

const dateFields = ['applicationDate', 'followUpDate', 'interviewDate'];
const applicationFields = [
  'companyName',
  'jobTitle',
  'jobType',
  'applicationSource',
  'location',
  'workArrangement',
  'salary',
  'applicationDate',
  'currentStatus',
  'recruiterName',
  'recruiterContact',
  'followUpDate',
  'interviewDate',
  'interviewDetails',
  'notes',
];

const buildApplicationFields = (body) => {
  const fields = {};

  for (const field of applicationFields) {
    if (!Object.hasOwn(body, field)) {
      continue;
    }

    const value = body[field];
    fields[field] = dateFields.includes(field)
      ? value
        ? new Date(value).toISOString()
        : null
      : typeof value === 'string'
        ? value.trim()
        : value;
  }

  return fields;
};

const createApplication = async (req, res) => {
  try {
    const now = new Date().toISOString();
    const application = {
      ...buildApplicationFields(req.body),
      user: req.user._id,
      jobType: req.body.jobType || 'Full-time',
      applicationSource: req.body.applicationSource || 'Company website',
      location: req.body.location?.trim() || '',
      workArrangement: req.body.workArrangement || 'Remote',
      salary: req.body.salary?.trim() || '',
      currentStatus: req.body.currentStatus || 'Saved',
      recruiterName: req.body.recruiterName?.trim() || '',
      recruiterContact: req.body.recruiterContact?.trim() || '',
      followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate).toISOString() : null,
      interviewDate: req.body.interviewDate ? new Date(req.body.interviewDate).toISOString() : null,
      interviewDetails: req.body.interviewDetails?.trim() || '',
      notes: req.body.notes?.trim() || '',
      _id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    await store.insert('applications', application);

    return res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Application creation failed',
    });
  }
};

const getApplications = async (req, res) => {
  try {
    const { status, search } = req.query;
    const searchTerm = typeof search === 'string' ? search.trim().toLowerCase() : '';
    const applications = (await store.readCollection('applications'))
      .filter((application) => application.user === req.user._id)
      .filter((application) => !status || status === 'All' || application.currentStatus === status)
      .filter((application) => {
        if (!searchTerm) {
          return true;
        }

        return [application.companyName, application.jobTitle, application.location]
          .some((value) => value?.toLowerCase().includes(searchTerm));
      })
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch applications',
    });
  }
};

const updateApplication = async (req, res) => {
  try {
    const updates = {
      ...buildApplicationFields(req.body),
      updatedAt: new Date().toISOString(),
    };
    const application = await store.updateById(
      'applications',
      req.params.id,
      updates,
      (record) => record.user === req.user._id
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Application update failed',
    });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const application = await store.deleteById(
      'applications',
      req.params.id,
      (record) => record.user === req.user._id
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Application deletion failed',
    });
  }
};

module.exports = {
  createApplication,
  getApplications,
  updateApplication,
  deleteApplication,
};
