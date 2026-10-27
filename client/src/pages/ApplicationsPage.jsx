import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const companySuggestions = [
  'Accenture',
  'Adobe',
  'Airbnb',
  'Amazon',
  'Apple',
  'Atlassian',
  'Cisco',
  'Deloitte',
  'Flipkart',
  'Google',
  'IBM',
  'Intel',
  'JPMorgan Chase',
  'Meesho',
  'Meta',
  'Microsoft',
  'Netflix',
  'NVIDIA',
  'Oracle',
  'PayPal',
  'Qualcomm',
  'Salesforce',
  'Samsung',
  'Shopify',
  'Spotify',
  'Tata Consultancy Services',
  'Uber',
  'Walmart',
  'Workday',
  'Zoho',
];

const jobTitleSuggestions = [
  'Account Executive',
  'Business Analyst',
  'Business Development Associate',
  'Cloud Engineer',
  'Content Writer',
  'Cybersecurity Analyst',
  'Data Analyst',
  'Data Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Digital Marketing Specialist',
  'Electrical Engineer',
  'Frontend Developer',
  'Full-Stack Developer',
  'Graphic Designer',
  'Human Resources Coordinator',
  'IT Support Specialist',
  'Machine Learning Engineer',
  'Management Trainee',
  'Mechanical Engineer',
  'Mobile App Developer',
  'Operations Analyst',
  'Product Designer',
  'Product Manager',
  'Project Coordinator',
  'QA Engineer',
  'Research Assistant',
  'Sales Associate',
  'Software Engineer',
  'Software Engineering Intern',
  'Technical Support Engineer',
  'UX Designer',
  'Web Developer',
];

const initialForm = {
  companyName: '',
  jobTitle: '',
  jobType: 'Full-time',
  workArrangement: 'Remote',
  applicationSource: 'Company website',
  applicationDate: new Date().toISOString().slice(0, 10),
  currentStatus: 'Applied',
  location: '',
  salary: '',
  recruiterName: '',
  recruiterContact: '',
  followUpDate: '',
  interviewDate: '',
  interviewDetails: '',
  notes: '',
};

const toDateInputValue = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  const loadApplications = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const { data } = await api.get('/applications', { params });
      setApplications(data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const sortedApplications = useMemo(() => {
    const records = [...applications];
    if (sortOrder === 'oldest') {
      return records.reverse();
    }
    if (sortOrder === 'company') {
      return records.sort((left, right) => left.companyName.localeCompare(right.companyName));
    }
    if (sortOrder === 'status') {
      return records.sort((left, right) => left.currentStatus.localeCompare(right.currentStatus));
    }
    return records;
  }, [applications, sortOrder]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleEdit = (application) => {
    setEditingId(application._id);
    setForm({
      companyName: application.companyName || '',
      jobTitle: application.jobTitle || '',
      jobType: application.jobType || 'Full-time',
      workArrangement: application.workArrangement || 'Remote',
      applicationSource: application.applicationSource || 'Company website',
      applicationDate: application.applicationDate ? new Date(application.applicationDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      currentStatus: application.currentStatus || 'Applied',
      location: application.location || '',
      salary: application.salary || '',
      recruiterName: application.recruiterName || '',
      recruiterContact: application.recruiterContact || '',
      followUpDate: toDateInputValue(application.followUpDate),
      interviewDate: toDateInputValue(application.interviewDate),
      interviewDetails: application.interviewDetails || '',
      notes: application.notes || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;

    setError('');
    setSuccess('');
    try {
      await api.delete(`/applications/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await loadApplications();
      setSuccess('Application deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete application.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await api.put(`/applications/${editingId}`, form);
      } else {
        await api.post('/applications', form);
      }
      resetForm();
      await loadApplications();
      setSuccess(editingId ? 'Application updated.' : 'Application added.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save application.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Applications</p>
          <h2>My job tracker</h2>
          <p className="dashboard-context">Keep the details that help you decide what to do next.</p>
        </div>
      </header>

      <div className="content-grid two-columns">
        <section className="page-panel" id="add-application">
          <h3>{editingId ? 'Edit application' : 'Add application'}</h3>
          <form className="stacked-form" onSubmit={handleSubmit}>
            <div className="two-col-inputs">
              <label>
                Company
                <input
                  name="companyName"
                  list="company-suggestions"
                  autoComplete="organization"
                  placeholder="Type or select a company"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                />
                <datalist id="company-suggestions">
                  {companySuggestions.map((company) => (
                    <option key={company} value={company} />
                  ))}
                </datalist>
              </label>
              <label>
                Job title
                <input
                  name="jobTitle"
                  list="job-title-suggestions"
                  placeholder="Type or select a job title"
                  value={form.jobTitle}
                  onChange={handleChange}
                  required
                />
                <datalist id="job-title-suggestions">
                  {jobTitleSuggestions.map((title) => (
                    <option key={title} value={title} />
                  ))}
                </datalist>
              </label>
            </div>

            <h4 className="form-section-title">Role details</h4>
            <div className="two-col-inputs">
              <label>
                Application source
                <select name="applicationSource" value={form.applicationSource} onChange={handleChange}>
                  <option>Company website</option>
                  <option>LinkedIn</option>
                  <option>Referral</option>
                  <option>Job board</option>
                  <option>Recruiter</option>
                  <option>Career fair</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Salary range
                <input
                  name="salary"
                  placeholder="e.g. $70k–$85k / year"
                  value={form.salary}
                  onChange={handleChange}
                  maxLength={80}
                />
              </label>
            </div>

            <div className="two-col-inputs">
              <label>
                Job type
                <select name="jobType" value={form.jobType} onChange={handleChange}>
                  <option>Full-time</option>
                  <option>Internship</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </label>
              <label>
                Work arrangement
                <select name="workArrangement" value={form.workArrangement} onChange={handleChange}>
                  <option>Remote</option>
                  <option>On-site</option>
                  <option>Hybrid</option>
                </select>
              </label>
            </div>

            <div className="two-col-inputs">
              <label>
                Application date
                <input type="date" name="applicationDate" value={form.applicationDate} onChange={handleChange} required />
              </label>
              <label>
                Status
                <select name="currentStatus" value={form.currentStatus} onChange={handleChange}>
                  <option>Saved</option>
                  <option>Applied</option>
                  <option>Assessment</option>
                  <option>Interview</option>
                  <option>Offer</option>
                  <option>Rejected</option>
                  <option>Withdrawn</option>
                </select>
              </label>
            </div>

            <label>
              Location
              <input name="location" value={form.location} onChange={handleChange} />
            </label>

            <h4 className="form-section-title">Hiring contact & timeline</h4>
            <div className="two-col-inputs">
              <label>
                Recruiter or contact
                <input
                  name="recruiterName"
                  placeholder="Contact name"
                  value={form.recruiterName}
                  onChange={handleChange}
                  maxLength={80}
                />
              </label>
              <label>
                Contact details
                <input
                  name="recruiterContact"
                  placeholder="Email or phone"
                  value={form.recruiterContact}
                  onChange={handleChange}
                  maxLength={120}
                />
              </label>
            </div>
            <div className="two-col-inputs">
              <label>
                Follow-up date
                <input type="date" name="followUpDate" value={form.followUpDate} onChange={handleChange} />
              </label>
              <label>
                Interview date
                <input type="date" name="interviewDate" value={form.interviewDate} onChange={handleChange} />
              </label>
            </div>
            <label>
              Interview details
              <textarea
                name="interviewDetails"
                rows={2}
                placeholder="Round, format, interviewer, or preparation notes"
                value={form.interviewDetails}
                onChange={handleChange}
                maxLength={500}
              />
            </label>

            <label>
              Additional notes
              <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} maxLength={1000} />
            </label>

            {error && <div className="error-box">{error}</div>}
            {success && <div className="success-box" role="status">{success}</div>}

            <div className="button-row">
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update application' : 'Save application'}
              </button>
              {editingId && (
                <button type="button" className="secondary-btn" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="page-panel">
          <div className="list-toolbar">
            <div className="list-heading">
              <h3>Application list</h3>
              <span>{applications.length} {applications.length === 1 ? 'role' : 'roles'}</span>
            </div>
            <div className="filter-row">
              <input
                type="text"
                placeholder="Search company or title"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option>All</option>
                <option>Saved</option>
                <option>Applied</option>
                <option>Assessment</option>
                <option>Interview</option>
                <option>Offer</option>
                <option>Rejected</option>
                <option>Withdrawn</option>
              </select>
              <select aria-label="Sort applications" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="company">Company A–Z</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="application-skeleton" role="status" aria-label="Loading applications">
              <span />
              <span />
              <span />
            </div>
          ) : sortedApplications.length === 0 ? (
            <div className="dashboard-empty">
              <p>{searchTerm || statusFilter !== 'All' ? 'No applications match these filters.' : 'No applications yet. Add your first role using the form.'}</p>
              {(searchTerm || statusFilter !== 'All') && (
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="application-list">
              {sortedApplications.map((application) => (
                <div key={application._id} className="application-item">
                  <div>
                    <strong>{application.companyName}</strong>
                    <p>{application.jobTitle}</p>
                    <div className="application-details">
                      {[application.jobType, application.workArrangement, application.location, application.applicationSource]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    {application.salary && <div className="application-details">Salary: {application.salary}</div>}
                    {application.recruiterName && (
                      <div className="application-details">
                        Contact: {application.recruiterName}
                        {application.recruiterContact ? ` · ${application.recruiterContact}` : ''}
                      </div>
                    )}
                    {application.followUpDate && (
                      <div className="application-details">
                        Follow-up: {new Date(application.followUpDate).toLocaleDateString()}
                      </div>
                    )}
                    {application.interviewDate && (
                      <div className="application-details">
                        Interview: {new Date(application.interviewDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="application-meta">
                    <span className={`status-pill status-${application.currentStatus?.toLowerCase()}`}>{application.currentStatus}</span>
                    <div className="mini-actions">
                      <button type="button" className="text-btn" onClick={() => handleEdit(application)}>
                        Edit
                      </button>
                      <button type="button" className="text-btn danger" onClick={() => handleDelete(application._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
