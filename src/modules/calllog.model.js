import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: false,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    callType: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    callStatus: {
      type: String,
      enum: ["completed", "missed", "rejected", "failed", "in-progress"],
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: Date,
    duration: {
      type: Number,
      description: "Duration in seconds",
    },
    recordingUrl: {
      type: String,
      required: false,
    },
    recordingDuration: {
      type: Number,
      description: "Recording duration in seconds",
    },
    transcript: String,
    summary: String,
    sentiment: {
      type: String,
      enum: ["positive", "negative", "neutral"],
    },
    callOutcome: {
      type: String,
      enum: ["reservation_made", "reservation_rescheduled", "no_action", "escalated"],
    },
    agentId: String,
    notes: String,
    qualityScore: {
      type: Number,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true },
);

export default mongoose.model("CallLog", callLogSchema);
