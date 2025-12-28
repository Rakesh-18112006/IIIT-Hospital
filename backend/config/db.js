import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      retryWrites: true,
      w: 'majority',
      // Connection pooling options
      maxPoolSize: 10,
      minPoolSize: 5,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('Unable to connect to MongoDB server. Please check:');
      console.error('1. Your internet connection');
      console.error('2. MongoDB Atlas cluster status (not paused)');
      console.error('3. IP whitelist in MongoDB Atlas');
      console.error('4. MongoDB connection string is correct');
      console.error('5. DNS resolution (try using different DNS: 8.8.8.8 or 1.1.1.1)');
    } else if (error.code === 'ENOTFOUND') {
      console.error('DNS resolution failed. The MongoDB hostname could not be resolved.');
      console.error('Possible solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Try changing your DNS server (8.8.8.8 for Google DNS)');
      console.error('3. Verify the MongoDB connection string is correct');
      console.error('4. Check if your network/firewall is blocking DNS queries');
    }
    
    process.exit(1);
  }
};

export default connectDB;
