const fs = require('fs');
const os = require('os');
const path = require('path');

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'careertrack-application-test-'));
process.env.CAREERTRACK_DATA_DIR = dataDirectory;
process.env.JWT_SECRET = 'careertrack-application-test-secret';

const request = require('supertest');
const app = require('../app');
const store = require('../storage/jsonStore');

afterAll(async () => {
  await fs.promises.rm(dataDirectory, { recursive: true, force: true });
});

describe('JSON-backed application API', () => {
  let token;
  let applicationId;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Application User',
        email: 'applications@example.com',
        password: 'password123',
      });

    token = response.body.token;
  });

  it('creates, lists, searches, filters, updates, and deletes applications', async () => {
    const createResponse = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyName: 'Northstar Labs',
        jobTitle: 'Frontend Engineer',
        jobType: 'Full-time',
        workArrangement: 'Remote',
        applicationSource: 'LinkedIn',
        salary: '$70k-$85k / year',
        applicationDate: new Date().toISOString(),
        currentStatus: 'Applied',
        location: 'Toronto',
        recruiterName: 'Alex Recruiter',
        recruiterContact: 'alex@example.com',
        followUpDate: new Date(Date.now() + 86400000).toISOString(),
        interviewDate: new Date(Date.now() + 172800000).toISOString(),
        interviewDetails: 'Technical round, video call.',
        notes: 'Contact the recruiter next week.',
      });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body.success).toBe(true);
    applicationId = createResponse.body.data._id;

    const listResponse = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.count).toBe(1);
    expect(listResponse.body.data[0].user).toBe(createResponse.body.data.user);
    expect(listResponse.body.data[0]).toMatchObject({
      applicationSource: 'LinkedIn',
      salary: '$70k-$85k / year',
      recruiterName: 'Alex Recruiter',
      recruiterContact: 'alex@example.com',
      interviewDetails: 'Technical round, video call.',
    });
    const searchResponse = await request(app)
      .get('/api/applications?search=northstar')
      .set('Authorization', `Bearer ${token}`);
    expect(searchResponse.body.count).toBe(1);

    const statusResponse = await request(app)
      .get('/api/applications?status=Offer')
      .set('Authorization', `Bearer ${token}`);
    expect(statusResponse.body.count).toBe(0);

    const updateResponse = await request(app)
      .put(`/api/applications/${applicationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyName: 'Northstar Labs',
        jobTitle: 'Senior Frontend Engineer',
        jobType: 'Full-time',
        workArrangement: 'Hybrid',
        applicationDate: new Date().toISOString(),
        currentStatus: 'Interview',
        location: 'Toronto',
        applicationSource: 'Referral',
        salary: '$80k-$95k / year',
        recruiterName: 'Jordan Recruiter',
        followUpDate: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Interview scheduled.',
      });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.data.jobTitle).toBe('Senior Frontend Engineer');
    expect(updateResponse.body.data.currentStatus).toBe('Interview');
    expect(updateResponse.body.data).toMatchObject({
      applicationSource: 'Referral',
      salary: '$80k-$95k / year',
      recruiterName: 'Jordan Recruiter',
    });
    const filteredResponse = await request(app)
      .get('/api/applications?status=Interview&search=senior')
      .set('Authorization', `Bearer ${token}`);
    expect(filteredResponse.body.count).toBe(1);

    const dashboardResponse = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(dashboardResponse.statusCode).toBe(200);
    expect(dashboardResponse.body.data.totals.totalApplications).toBe(1);
    expect(dashboardResponse.body.data.totals.interviews).toBe(1);
    expect(dashboardResponse.body.data.totals.upcomingFollowUps).toBe(1);
    expect(dashboardResponse.body.data.statusDistribution.find((entry) => entry.name === 'Interview').value).toBe(1);

    const deleteResponse = await request(app)
      .delete(`/api/applications/${applicationId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.statusCode).toBe(200);

    const emptyListResponse = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${token}`);
    expect(emptyListResponse.body.count).toBe(0);
  });

  it('does not expose or return another user’s records', async () => {
    const ownerApplication = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyName: 'Private Company',
        jobTitle: 'Private Role',
        applicationDate: new Date().toISOString(),
      });

    expect(ownerApplication.statusCode).toBe(201);

    const otherUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

    const response = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${otherUserResponse.body.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(0);

    const storedApplications = await store.readCollection('applications');
    expect(storedApplications).toHaveLength(1);
    expect(storedApplications[0].user).not.toBe(otherUserResponse.body.user.id);

    await request(app)
      .delete(`/api/applications/${ownerApplication.body.data._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('rejects unauthenticated application access', async () => {
    const response = await request(app).get('/api/applications');
    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
