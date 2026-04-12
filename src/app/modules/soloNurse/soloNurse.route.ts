import { Router } from "express";
import { SoloNurseController } from "./soloNurse.controller";
import { createUploader } from "../../utils/cloudinary";

const nurseCertificate = createUploader("nurseCertificates");
const soloNurseProfileImage = createUploader("soloNurseProfileImage");

const router = Router();

router.get("/getAll", SoloNurseController.getAllSoloNurses);
router.get("/getSingle/:userId", SoloNurseController.getSoloNurseById);
router.put(
  "/update-basic/:userId",
  soloNurseProfileImage.single("profileImage"),
  SoloNurseController.updateSoloNurseBasic,
);
router.put(
  "/update-professional/:userId/",
  SoloNurseController.professionalUpdate,
);
router.put(
  "/addSingleSubService/:userId/:serviceId/:serviceName",
  SoloNurseController.addSubServiceWithAutoMainService,
);
router.put(
  "/deleteSingleSubService/:userId/:serviceId/:subServiceId",
  SoloNurseController.deleteSingleSubService,
);
router.put(
  "/upload-certificate/:userId",
  nurseCertificate.single("uploadCertificates"),
  SoloNurseController.uploadCertificate,
);

router.delete(
  "/delete-certificate/:userId/:certificateId",
  SoloNurseController.deleteCertificate,
);

router.put("/availability/:userId", SoloNurseController.availabilitySettings);
router.put(
  "/addNewPaymentMethod/:userId",
  SoloNurseController.addNewPaymentMethod,
);


router.put("/addReviews/:userId", SoloNurseController.addReviews);

router.delete(
  "/delete/:soloNurseUserId/:soloNurseId",
  SoloNurseController.deleteSoloNurse,
);
router.get(
  "/getSoloNursePaymentData/:soloNurseId",
  SoloNurseController.getSoloNursePaymentData,
);

router.get(
  "/get/sub-services",
  SoloNurseController.getSubServicesByMainService,
);
router.get(
  "/getSoloNurseDashboardOverview/:soloNurseId",
  SoloNurseController.getSoloNurseDashboardOverview,
);

export const SoloNurseRoutes = router;
