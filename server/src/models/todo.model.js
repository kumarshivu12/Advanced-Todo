import mongoose, { Schema } from "mongoose";

const todoSchema = new Schema(
  {
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "user is required"],
    },
    title: {
      type: String,
      required: [true, "title is required"],
    },
    description: {
      type: String,
      required: [true, "description is required"],
    },
    priority: {
      type: String,
      enums: ["low", "mwdium", "high"],
      required: [true, "priority is required"],
      default: "high",
    },
    startDate: {
      type: Date,
      required: [true, "startDate is required"],
      default: new Date(),
    },
    endDate: {
      type: Date,
      required: [true, "endDate is required"],
      default: new Date(),
    },
    status: {
      type: Boolean,
      required: [true, "status is required"],
      default: false,
    },
  },
  { timestamps: true }
);

export const Todo = mongoose.model("Todo", todoSchema);
