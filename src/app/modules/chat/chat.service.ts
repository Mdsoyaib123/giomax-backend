import { User_Model } from "../user/user.schema";
import { ChatModel } from "./chat.model";

export const chatService = {
  getConversation: async (userA: string, userB: string) => {
    return ChatModel.find({
      $or: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
    }).sort({ createdAt: 1 });
  },

  getAdminConversation: async (userId: string, adminIds: string[]) => {
    return ChatModel.find({
      $or: [
        { senderId: userId, receiverType: "admin" },
        { senderId: { $in: adminIds }, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });
  },
getAdminUserConversation: async (
  adminId: string,
  userId: string
) => {
  return ChatModel.find({
    chatType: "user_admin",
    $or: [
      // User → Admin
      { senderId: userId, receiverType: "admin" },

      // Admin → User
      { senderId: adminId, receiverId: userId }
    ],
  })
    .sort({ createdAt: 1 })
    .lean();
},


  documentOrFileUpload: async (file: any) => {
    return {
      success: true,
      message: "File uploaded successfully",
      data: file,
    };
  },
  getUserListsForAdminChat: async () => {
    const usersLists = await ChatModel.find({ receiverType: "admin" }).distinct(
      "senderId"
    );
    // console.log("user list ", usersLists);

    const users = await User_Model.find({ _id: { $in: usersLists } });
    return { users };
  },
};
