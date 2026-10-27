const fs = require('fs');
const os = require('os');
const path = require('path');

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'careertrack-storage-test-'));
process.env.CAREERTRACK_DATA_DIR = dataDirectory;

const store = require('../storage/jsonStore');

afterAll(async () => {
  await fs.promises.rm(dataDirectory, { recursive: true, force: true });
});

describe('JSON storage', () => {
  it('creates missing collections and preserves concurrent inserts', async () => {
    expect(await store.readCollection('applications')).toEqual([]);

    await Promise.all(
      Array.from({ length: 20 }, (_, index) => store.insert('applications', {
        _id: `application-${index}`,
        companyName: `Company ${index}`,
      }))
    );

    const records = await store.readCollection('applications');
    expect(records).toHaveLength(20);
    expect(new Set(records.map((record) => record._id)).size).toBe(20);
  });

  it('enforces unique user fields across concurrent inserts', async () => {
    const results = await Promise.allSettled([
      store.insertUnique('users', { _id: 'user-1', email: 'same@example.com' }, 'email'),
      store.insertUnique('users', { _id: 'user-2', email: 'same@example.com' }, 'email'),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(await store.readCollection('users')).toHaveLength(1);
  });

  it('reports corrupt JSON without silently replacing the data', async () => {
    const usersFile = path.join(dataDirectory, 'users.json');
    await fs.promises.writeFile(usersFile, '{broken', 'utf8');

    await expect(store.readCollection('users')).rejects.toThrow(/Invalid JSON in users\.json/);
    expect(await fs.promises.readFile(usersFile, 'utf8')).toBe('{broken');
  });
});
