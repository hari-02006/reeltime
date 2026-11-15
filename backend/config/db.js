const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured. Add your MongoDB Atlas connection string to .env.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || "movieWatchlist" });
  console.log(`MongoDB connected (${mongoose.connection.name}).`);
}

module.exports = connectDatabase;
