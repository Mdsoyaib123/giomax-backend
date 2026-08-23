import { model, Schema } from "mongoose";

const mainServiceSchema = new Schema(
  {
    name: {
      type: String,
      enum: [
        "General nurse care",
        "Physio therapy",
        "Pregnancy care",
        "Mental Health",
      ],
      required: true,
    },
    georgiaName: {
      type: String,
      enum: [
        "ზოგადი საექთნო მოვლა",
        "ფიზიოთერაპია",
        "ორსულთა მოვლა",  
      "ფსიქიკური ჯანმრთელობა",
      ],
      required: true,
    },   
  },
  { timestamps: true }
);

export const MainService_Model = model("MainService", mainServiceSchema);
