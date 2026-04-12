import { MainService_Model } from "./mainService.model";

const createMainService = async ( payload : any) => {
    const newService = new MainService_Model(payload);
    return await newService.save();
  
};
const getAllMainServices = async () => {
  return await MainService_Model.find().select("_id name");
};

export const MainServiceService = {
    createMainService,
  getAllMainServices,

};
