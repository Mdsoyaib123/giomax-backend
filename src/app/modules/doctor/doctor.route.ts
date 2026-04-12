import { Router } from "express";
import { DoctorController } from "./doctor.controller";
import { createUploader } from "../../utils/cloudinary";
import auth from "../../middlewares/auth";

const doctorCertificate = createUploader("doctorCertificates");
const doctorProfileImage = createUploader("doctorProfileImage");

const router = Router();

router.put("/update/:doctorId", DoctorController.updateDoctor);
router.get("/getAll", DoctorController.getDoctors);
router.get("/getSingle/:userId", DoctorController.getDoctorById);
router.get(
  "/getSinglePatientList/:doctorId",
  DoctorController.getSingleDoctorPatientList
);
router.put(
  "/update-basic/:userId",
  doctorProfileImage.single("profileImage"),
  DoctorController.updateDoctorBasic
);
router.put("/update-professional/:userId", DoctorController.professionalUpdate);

router.put(
  "/upload-certificate/:userId",

  doctorCertificate.single("uploadCertificates"),
  DoctorController.uploadCertificate
);

router.delete(
  "/delete-certificate/:userId/:certificateId",
  DoctorController.deleteCertificate
);

router.put("/delete-doctor", DoctorController.deleteDoctor);
router.get(
  "/getDoctorDashboardOverview/:doctorId",
  DoctorController.getDoctorDashboardOverview
);

router.put("/addReviews/:userId", DoctorController.addReviews);

export const DoctorRoutes = router;
