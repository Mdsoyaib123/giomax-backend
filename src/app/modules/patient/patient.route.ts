import { Router } from "express";
import { patientController } from "./patient.controller";
import { createUploader } from "../../utils/cloudinary";

const router = Router();

const patientNationalId = createUploader("patientNationalId");

router.get("/getAll", patientController.getAllPatients);
router.get("/getSinglePatient/:userId", patientController.getPatientById);
router.put(
  "/update-basic/:userId",
  patientNationalId.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "nidFront", maxCount: 1 },
    { name: "nidBack", maxCount: 1 },
  ]),
  patientController.updatePatientBasic,
);

router.patch(
  "/createOrUpdateAddress/:userId",
  patientController.createOrUpdateAddress,
);
router.patch(
  "/setDefaultAddress/:patientId/:addressId",
  patientController.setDefaultAddressController,
);

// Delete address
router.delete(
  "/deleteAddress/:patientId/:addressId",
  patientController.deleteAddressController,
);

router.post(
  "/medical-history/:userId",
  patientController.addMedicalHistoryService,
);
router.put(
  "/update/medical-history/:userId",
  patientController.updateMedicalHistoryService,
);
router.delete(
  "/delete/medical-history/:userId",
  patientController.deleteMedicalHistoryService,
);

router.put(
  "/addNewPaymentMethod/:userId",
  patientController.addNewPaymentMethod,
);
router.patch(
  "/payment-methods/:patientId/:paymentMethodId/set-default",
  patientController.setDefaultPaymentMethod,
);

router.delete("/deletePatient/:patientId", patientController.deletePatient);

export const patientRoutes = router;
