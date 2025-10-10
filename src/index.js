// require("dotenv").config({ path: "./.env" });
import { DB_NAME } from "./constants.js"; // note the .js
import connectDB from "./db/index.js"; // note the .js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

connectDB();

/*
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_NAME } from "./constants.js"; // note the .js

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in .env");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
    console.log("✅ Connected to MongoDB");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server started at http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
      console.error("HTTP server error:", err);
      process.exit(1);
    });
  } catch (error) {
    console.error("Mongo/Startup error:", error);
    process.exit(1);
  }
})();

*/
