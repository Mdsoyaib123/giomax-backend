import { Router } from "express";
import { soloNurseAppointmentController } from "./soloNurseAppoinment.controller";

const router = Router();

router.post("/create", soloNurseAppointmentController.create);
router.post("/reschedule", soloNurseAppointmentController.Reschedule);
router.get("/getAll", soloNurseAppointmentController.getAll);
router.get("/getSingle/:id", soloNurseAppointmentController.getById);
router.put("/update/:id", soloNurseAppointmentController.update);
router.get(
  "/getSelectedDateAndTime/:id",
  soloNurseAppointmentController.getSelectedDateAndTime,
);
router.post(
  "/getAppoinmentTimeBasedOnDate/:id",
  soloNurseAppointmentController.getAppoinmentTimeBasedOnDate,
);
router.get(
  "/getSinglePaintentAppointmentForNurse/:patientId",
  soloNurseAppointmentController.getSinglePaintentAppointmentForNurse,
);
router.get(
  "/getSingleNurseAppointment/:soloNurseId",
  soloNurseAppointmentController.getSingleNurseAppointment,
);

router.get(
  "/getSinlgePatientChatsForNurse/:soloNurseUserId",
  soloNurseAppointmentController.getSinlgePatientChatsForNurse,
);
router.get(
  "/getSinglePatientChatsWithNurse/:patientUserId",
  soloNurseAppointmentController.getSinlgePatientChatsWithNurse,
);
router.delete(
  "/deleteAppointment/:appoinmentId",
  soloNurseAppointmentController.deleteAppointment,
);
router.get(
  "/getAllSoloNurseCompletedAppoinmentAndAmount",
  soloNurseAppointmentController.getAllSoloNurseCompletedAppoinmentAndAmount,
);


export const soloNurseAppoinmentRoutes = router;
