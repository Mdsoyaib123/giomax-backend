import { Router } from "express";
import { chatController } from "./chat.controller";
import auth from "../../middlewares/auth";
import { createUploader } from "../../utils/cloudinary";

const uploadFileAndDocumentForChat = createUploader("fileAndDocumentForChat");

const router = Router();

router.get(
  "/getChat/:id",
  auth("patient", "doctor", "solo_nurse", "clinic", "admin"),
  chatController.getConversation
);
router.get(
  "/admin/history",
  auth("patient", "doctor", "solo_nurse", "clinic", "admin"),
  chatController.getAdminConversation
);
router.get(
  "/admin/getUserConversation/:userId",
  auth("patient", "doctor", "solo_nurse", "clinic", "admin"),
  chatController.getAdminUserConversation
);

router.post(
  "/uploadFileOrDocument",
  uploadFileAndDocumentForChat.single("file"),
  chatController.documentOrFileUpload
);
router.get("/adminChat/getUserLists", chatController.getUserListsForAdminChat);

export const ChatRoutes = router;
