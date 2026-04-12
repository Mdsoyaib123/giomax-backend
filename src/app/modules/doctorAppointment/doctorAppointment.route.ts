import express from "express";
import { doctorAppointmentController } from "./doctorAppointment.controller";

const router = express.Router();

router.post("/create", doctorAppointmentController.create);
router.post("/reschedule", doctorAppointmentController.Reschedule);
router.get("/getAll", doctorAppointmentController.getAll);
router.get("/getSingle/:id", doctorAppointmentController.getOne);
router.get(
  "/getAdvanceFilter",
  doctorAppointmentController.AdvanceFilterInDashboard
);
router.get(
  "/getSinglePaintentAppointment/:patientId",
  doctorAppointmentController.getSinglePaintentAppointment
);
router.get(
  "/getSingleDoctorAppointment/:doctorId",
  doctorAppointmentController.getSingleDoctorAppointment
);

router.get(
  "/getSinglePaitentChats/:patientId/:date",
  doctorAppointmentController.getSinglePaitentChats
);
router.get(
  "/getSingleDoctorChats/:doctorId/:date",
  doctorAppointmentController.getSingleDoctorChats
);
router.get(
  "/getSingleClinicChats/:clinicUserId",
  doctorAppointmentController.getSinlgeClinicChats
);

router.get(
  "/getSinlgePatientChatsWithClinic/:patientUserId",
  doctorAppointmentController.getSinglePatientChatsWithClinic
);
router.patch("/update-status/:id", doctorAppointmentController.updateStatus);
router.get(
  "/getSelectedDateAndTime/:id",
  doctorAppointmentController.getSelectedDateAndTime
);
router.post(
  "/getAppoinmentTimeBasedOnDate/:id",
  doctorAppointmentController.getAppoinmentTimeBasedOnDate
);

router.delete("/delete/:appoinmentId", doctorAppointmentController.delete);

export const DoctorAppointmentRoutes = router;
