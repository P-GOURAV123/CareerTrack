const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const dataDirectory = process.env.CAREERTRACK_DATA_DIR || path.join(__dirname, '..', 'data');
const collectionFiles = {
  users: 'users.json',
  applications: 'applications.json',
};
const writeQueues = new Map();

const getCollectionFile = (collection) => {
  const fileName = collectionFiles[collection];

  if (!fileName) {
    throw new Error(`Unknown JSON storage collection: ${collection}`);
  }

  return path.join(dataDirectory, fileName);
};

const ensureCollectionFile = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.writeFile(filePath, '[]\n', { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

const readCollection = async (collection) => {
  const filePath = getCollectionFile(collection);
  await ensureCollectionFile(filePath);

  let contents;
  try {
    contents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read ${collection} storage: ${error.message}`, { cause: error });
  }

  let records;
  try {
    records = JSON.parse(contents);
  } catch (error) {
    throw new Error(`Invalid JSON in ${path.basename(filePath)}. Repair the file before continuing.`, {
      cause: error,
    });
  }

  if (!Array.isArray(records) || records.some((record) => !record || typeof record !== 'object' || Array.isArray(record))) {
    throw new Error(`${path.basename(filePath)} must contain a JSON array of records.`);
  }

  return records;
};

const initializeStorage = async () => {
  await Promise.all([readCollection('users'), readCollection('applications')]);
};

const writeCollection = async (collection, records) => {
  const filePath = getCollectionFile(collection);
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;

  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.rm(temporaryPath, { force: true });
    } catch (cleanupError) {
      console.error(`Unable to clean up temporary ${collection} storage file:`, cleanupError.message);
    }

    throw new Error(`Unable to write ${collection} storage: ${error.message}`, { cause: error });
  }
};

const mutateCollection = async (collection, mutator) => {
  const previousWrite = writeQueues.get(collection) || Promise.resolve();
  const currentWrite = previousWrite.catch(() => undefined).then(async () => {
    const records = await readCollection(collection);
    const result = await mutator(records);

    if (result.write !== false) {
      await writeCollection(collection, records);
    }

    return result.value;
  });
  writeQueues.set(collection, currentWrite);

  try {
    return await currentWrite;
  } finally {
    if (writeQueues.get(collection) === currentWrite) {
      writeQueues.delete(collection);
    }
  }
};

const findOne = async (collection, predicate) => {
  const records = await readCollection(collection);
  return records.find(predicate) || null;
};

const findById = async (collection, id) => {
  return findOne(collection, (record) => record._id === String(id));
};

const insert = async (collection, record) => {
  return mutateCollection(collection, (records) => {
    records.push(record);
    return { value: record };
  });
};

const insertUnique = async (collection, record, field) => {
  return mutateCollection(collection, (records) => {
    if (records.some((existing) => existing[field] === record[field])) {
      const error = new Error(`A record with this ${field} already exists.`);
      error.code = 'DUPLICATE_RECORD';
      throw error;
    }

    records.push(record);
    return { value: record };
  });
};

const updateById = async (collection, id, updates, predicate = () => true) => {
  return mutateCollection(collection, (records) => {
    const record = records.find((item) => item._id === String(id) && predicate(item));
    if (!record) {
      return { value: null, write: false };
    }

    Object.assign(record, typeof updates === 'function' ? updates(record) : updates);
    return { value: record };
  });
};

const deleteById = async (collection, id, predicate = () => true) => {
  return mutateCollection(collection, (records) => {
    const index = records.findIndex((item) => item._id === String(id) && predicate(item));
    if (index === -1) {
      return { value: null, write: false };
    }

    return { value: records.splice(index, 1)[0] };
  });
};

const deleteWhere = async (collection, predicate) => {
  return mutateCollection(collection, (records) => {
    const remaining = records.filter((record) => !predicate(record));
    const deletedCount = records.length - remaining.length;

    if (deletedCount > 0) {
      records.length = 0;
      for (const record of remaining) {
        records.push(record);
      }
    }

    return { value: deletedCount, write: deletedCount > 0 };
  });
};

module.exports = {
  deleteById,
  deleteWhere,
  findById,
  findOne,
  initializeStorage,
  insert,
  insertUnique,
  readCollection,
  updateById,
};
