const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const store = require('./storage/jsonStore');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await store.initializeStorage();
    app.listen(PORT, () => {
      console.log(`CareerTrack server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('CareerTrack could not initialize local JSON storage:', error.message);
    process.exitCode = 1;
  }
};

startServer();
