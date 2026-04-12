import { Request, Response } from "express";
import { chatService } from "./chat.service";
import { User_Model } from "../user/user.schema";

export const chatController = {
  // user ↔ user
  getConversation: async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: user not found in request" });
    }
    const userId = req.user.userId as string;
    const otherUserId = req.params.id;

    const messages = await chatService.getConversation(userId, otherUserId as string);
    res.json(messages);
  },

  // user ↔ admin
  getAdminConversation: async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: user not found in request" });
    }
    const userId = req?.user.userId as string;

    const admins = await User_Model.find({ role: "admin" }).select("_id");
    const adminIds = admins.map((a) => a._id.toString());

    const messages = await chatService.getAdminConversation(userId, adminIds);
    res.json(messages);
  },
  getAdminUserConversation: async (req: Request, res: Response) => {
    const adminId = req.user?.userId;
    const { userId } = req.params;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const messages = await chatService.getAdminUserConversation(
      adminId,
      userId as string
    );

    res.json(messages);
  },

  documentOrFileUpload: async (req: Request, res: Response) => {
    const file = req.file ? (req.file as any).path : null;
    console.log("file", file);

    const messages = await chatService.documentOrFileUpload(file);
    res.json(messages);
  },
  getUserListsForAdminChat: async (req: Request, res: Response) => {
    const messages = await chatService.getUserListsForAdminChat();
    res.json(messages);
  },
};
