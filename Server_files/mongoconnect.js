import mongoose from "mongoose";

const connectdb = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is missing from the environment");
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB");
};

export default connectdb;import mongoose from "mongoose";

const connectdb = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is missing from the environment");
  }

  await mongoose.connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: 10000, // fail after 10s instead of hanging
    connectTimeoutMS: 10000,
  });

  console.log("Connected to MongoDB");
};

export default connectdb;