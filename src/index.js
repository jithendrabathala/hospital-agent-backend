import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { getHospitalsByLocation } from "./utils/hospitalUtils.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hospital-booking-agent";

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// getHospitalsByLocation("New York");

// Start server
app.listen(PORT, () => {
  console.log(
    "today date is in format (MM/DD/YYYY Week) is, ",
    `${new Date().toLocaleDateString()} ${new Date().toLocaleDateString("en-US", { weekday: "long" })}`,
  );
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/api/twilio/conversational-relay`);
});
