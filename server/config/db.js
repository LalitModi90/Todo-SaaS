const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  const mongoUri = process.env.MONGOOS_URL || process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      console.log('Connecting to MongoDB Atlas / Remote database...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000 // 5 seconds timeout to detect whitelist/network issues fast
      });
      console.log('Successfully connected to MongoDB Atlas / Remote database');
      return;
    } catch (err) {
      console.warn('MongoDB Atlas connection failed:', err.message);
      console.log('Falling back to In-Memory MongoDB for seamless operation...');
    }
  } else {
    console.log('No MONGOOS_URL found in environment variables. Starting In-Memory MongoDB...');
  }

  try {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to In-Memory MongoDB successfully');
  } catch (err) {
    console.error('Fatal Error starting In-Memory MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
