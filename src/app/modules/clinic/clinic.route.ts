import { Router } from "express";
import { ClinicController } from "./clinic.controller";
import { createUploader } from "../../utils/cloudinary";

const clinicCertificate = createUploader("clinicCertificates");
const clinicProfileImage = createUploader("clinicProfileImage");

const router = Router();

router.get("/getAll", ClinicController.getAllClinics);
router.get("/getSingle/:userId", ClinicController.getClinicById);
router.get(
  "/getClinicAppointments/:clinicId",
  ClinicController.getClinicAppointments,
);
router.get(
  "/getAllAppoinmentsPrefarenceDate/:clinicId",
  ClinicController.getAllAppoinmentsPrefarenceDate,
);
router.get("/getClinicDoctors/:clinicId", ClinicController.getClinicDoctors);
router.get("/getClinicPatients/:clinicId", ClinicController.getClinicPatients);
router.put(
  "/update-basic/:userId",
  clinicProfileImage.single("profileImage"),
  ClinicController.updateClinicBasic,
);
router.put(
  "/update-responsible-person-info/:userId",
  ClinicController.updateClinicResponsiblePersonInfo,
);
router.put(
  "/upload-certificate/:userId",
  clinicCertificate.single("uploadCertificates"),
  ClinicController.uploadCertificate,
);

router.delete(
  "/delete-certificate/:userId/:certificateId",
  ClinicController.deleteCertificate,
);
router.put("/availability/:userId", ClinicController.availabilitySettings);
router.put("/addReviews/:userId", ClinicController.addReviews);
router.put(
  "/addNewPaymentMethod/:userId",
  ClinicController.addNewPaymentMethod,
);
router.delete("/delete/:userId", ClinicController.deleteClinic);
router.post(
  "/getAppoinmentTimeBasedOnDateForClinic/:id",
  ClinicController.getAppoinmentTimeBasedOnDateForClinic,
);
router.get(
  "/getClinicPaymentData/:clinicUserId",
  ClinicController.getClinicPaymentData,
);
router.get(
  "/getClinicDashboardOverview/:clinicId",
  ClinicController.getClinicDashboardOverview,
);
router.get("/getAllClinicName", ClinicController.getAllClinicName);

export const ClinicRoutes = router;
