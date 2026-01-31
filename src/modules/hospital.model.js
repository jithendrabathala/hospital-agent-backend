import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        description: "[longitude, latitude]",
      },
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    specialties: [
      {
        type: String,
        trim: true,
      },
    ],
    departments: [
      {
        name: String,
        phone: String,
      },
    ],
    availability: {
      type: String,
      enum: ["24/7", "business-hours", "limited"],
      default: "business-hours",
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Create geospatial index for location-based queries
hospitalSchema.index({ location: "2dsphere" });

export default mongoose.model("Hospital", hospitalSchema);
