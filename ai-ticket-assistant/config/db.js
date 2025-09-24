const mongoose = require('mongoose');
const logger = require('../src/utils/logger');

const connectDB = async () => {
  try {
    // Read URIs
    let mongoURI = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : '';

    if (!mongoURI) {
      logger.error('❌ MONGO_URI is not defined in the .env file.');
      throw new Error('MONGO_URI is not defined.');
    }

    // Strip accidental wrapping quotes from env value
    if (
      (mongoURI.startsWith('"') && mongoURI.endsWith('"')) ||
      (mongoURI.startsWith("'") && mongoURI.endsWith("'"))
    ) {
      mongoURI = mongoURI.slice(1, -1);
    }

    // Prepare test URI safely (and normalize localhost → 127.0.0.1)
    let testURI = null;
    if (process.env.MONGO_TEST_URI && process.env.MONGO_TEST_URI.trim()) {
      testURI = process.env.MONGO_TEST_URI.trim().replace(
        'localhost',
        '127.0.0.1'
      );
    }

    // Decide which URI to use
    const connectionURI =
      process.env.NODE_ENV === 'test' && testURI ? testURI : mongoURI;

    // Validate URI scheme early to catch common mistakes
    const hasValidScheme =
      connectionURI.startsWith('mongodb://') ||
      connectionURI.startsWith('mongodb+srv://');
    if (!hasValidScheme) {
      throw new Error(
        'Invalid scheme for MongoDB URI. Expected it to start with "mongodb://" or "mongodb+srv://"'
      );
    }

    logger.info(`Attempting to connect to MongoDB...`);

    const conn = await mongoose.connect(connectionURI);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('❌ Database connection failed. Please check the following:', {
      '1. MONGO_URI': 'Ensure it is correct in your .env file.',
      '2. IP Allowlist':
        'Make sure your current IP address is added to the MongoDB Atlas Network Access list.',
      '3. Network':
        'Check for firewalls or network issues blocking the connection.',
      'Error Message': error.message,
    });

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

module.exports = connectDB;
