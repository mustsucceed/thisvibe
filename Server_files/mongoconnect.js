import mongoose from "mongoose";

const connectdb = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is missing from the environment");
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB");
};

export default connectdb;
