import { Router } from "express";
import { user_routes } from "./app/modules/user/user.route";
import authRoute from "./app/modules/auth/auth.route";
import { patientRoutes } from "./app/modules/patient/patient.route";
import { ClinicRoutes } from "./app/modules/clinic/clinic.route";
import { SoloNurseRoutes } from "./app/modules/soloNurse/soloNurse.route";
import { DoctorRoutes } from "./app/modules/doctor/doctor.route";
import { DoctorAppointmentRoutes } from "./app/modules/doctorAppointment/doctorAppointment.route";
import { soloNurseAppoinmentRoutes } from "./app/modules/soloNurseAppoinment/soloNurseAppoinment.route";
import { MainServiceRoutes } from "./app/modules/mainService/mainService.route";
import { AgoraVideoCallRoute } from "./app/modules/AgoraVideoCall/AgoraVideoCall.route";
import { PaymentRoutes } from "./app/modules/payment/payment.route";
import { ChatRoutes } from "./app/modules/chat/chat.route";
import { notificationRoutes } from "./app/modules/notifications/notification.route";
import { WithdrawRequestRoutes } from "./app/modules/withdrowRequest/withdrowRequest.route";

import { WalletRoutes } from "./app/modules/wallet/wallet.route";
import { RefundRoutes } from "./app/modules/refund/refund.route";
import { AdminRoutes } from "./app/modules/admin/admin.route";

const appRouter = Router();

const moduleRoutes = [
  { path: "/auth", route: authRoute },
  { path: "/user", route: user_routes },
  { path: "/patient", route: patientRoutes },
  { path: "/clinic", route: ClinicRoutes },
  { path: "/solo-nurse", route: SoloNurseRoutes },
  { path: "/main-service", route: MainServiceRoutes },
  { path: "/doctor", route: DoctorRoutes },
  { path: "/doctor-appointment", route: DoctorAppointmentRoutes },
  { path: "/solo-nurse-appointment", route: soloNurseAppoinmentRoutes },
  { path: "/agora-video-call", route: AgoraVideoCallRoute },
  { path: "/payment", route: PaymentRoutes },
  { path: "/chatHistory", route: ChatRoutes },
  { path: "/notification", route: notificationRoutes },
  { path: "/withdrawRequest", route: WithdrawRequestRoutes },
  { path: "/admin", route: AdminRoutes },
  { path: "/wallet", route: WalletRoutes },
  { path: "/refund", route: RefundRoutes },
];

moduleRoutes.forEach((route) => appRouter.use(route.path, route.route));
export default appRouter;
