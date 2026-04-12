import { Router } from "express";

import { createUploader } from "../../utils/cloudinary";
import { user_controllers } from "./user.controller";

const nurseCertificate = createUploader("nurseCertificates");

const clinicCertificate = createUploader("clinicCertificates");
const doctorCertificate = createUploader("doctorCertificates");

const patientNationalId = createUploader("patientNationalId");

const router = Router();

// CREATE paitent
router.post(
  "/create-paient",
  patientNationalId.fields([
    { name: "nidFront", maxCount: 1 },
    { name: "nidBack", maxCount: 1 },
  ]),
  user_controllers.createPatient,
);
router.post(
  "/create-solo-nurse",
  nurseCertificate.single("uploadCertificates"),
  user_controllers.createSoloNurse,
);
router.post(
  "/create-clinic",
  clinicCertificate.single("uploadCertificates"),
  user_controllers.createClinic,
);
router.post(
  "/create-doctor",
  doctorCertificate.single("uploadCertificates"),
  user_controllers.createDoctor,
);
router.get("/get-admin", user_controllers.getAdmin);
router.put("/verify-user/:userId/:code", user_controllers.verifyUser);
router.put("/add-admin-approval/:userId", user_controllers.addAdminApproval);

export const user_routes = router;
