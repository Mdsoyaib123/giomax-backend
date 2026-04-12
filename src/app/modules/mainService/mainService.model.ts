import { model, Schema } from "mongoose";

const mainServiceSchema = new Schema(
  {
    name: {
      type: String,
      enum: [
        "General nurse care",
        "Physio therapy",
        "Pregnancy care",
        "Other",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

export const MainService_Model = model("MainService", mainServiceSchema);
