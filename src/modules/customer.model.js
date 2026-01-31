import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Customer", customerSchema);
