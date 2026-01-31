import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    appointmentType: {
      type: String,
      enum: ["consultation", "surgery", "checkup", "emergency", "follow-up"],
      required: true,
    },
    reservationDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    reason: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "no-show"],
      default: "pending",
    },
    callLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CallLog",
      required: false,
    },
    notes: String,
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Reservation", reservationSchema);
