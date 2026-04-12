import { User_Model } from "../modules/user/user.schema";
import { AppError } from "./app_error";
import httpStatus from "http-status";

export const isAccountExist = async (email: string, populateField?: string) => {
  let isExistAccount;
  if (populateField) {
    isExistAccount = await User_Model.findOne({ email }).populate(
      populateField
    );
  } else {
    isExistAccount = await User_Model.findOne({ email });
  }
  // check account
  if (!isExistAccount) {
    throw new AppError("Account not found!!", httpStatus.NOT_FOUND);
  }
  return isExistAccount;
};



