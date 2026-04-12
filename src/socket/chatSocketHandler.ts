import { ChatModel } from "../app/modules/chat/chat.model";
import { User_Model } from "../app/modules/user/user.schema";
import { sendNotification } from "../app/utils/notificationHelper";

const onlineUsers = new Map<string, string>();

// 🔹 Helper function
const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

export const chatSocketHandler = (
  io: any,
  socket: any,
  user: any,
  userId: string
) => {
  try {
    // 🔹 Track online users globally (userId -> socketId)
    onlineUsers.set(userId, socket.id);
    console.log("login user ", userId);

    // Admin joins special room
    if (user.role === "admin") {
      socket.join("ADMIN_ROOM");
      console.log("Admin joined room");
    }

    // 🔵 Send normal message (user ↔ user)
    socket.on("send_message", async (data: any) => {
      try {
        const { receiverId, message, chatType, document, customOffer } = data;

        if (!message && !document && !customOffer) {
          return console.log("Message, document, or custom offer is required");
        }

        const payload: any = {
          senderId: userId,
          receiverId,
          chatType,
        };

        if (message) payload.message = message;
        if (document) payload.document = document;
        if (customOffer) payload.customOffer = customOffer;

        const newMsg = await ChatModel.create(payload);

        socket.emit("message_sent", newMsg);
        io.to(receiverId).emit("receive_message", newMsg);

        const receiver = await User_Model.findById(receiverId);
        await sendNotification(
          receiverId,
          receiver?.fullName as string,
          message || "📎 Attachment received",
          "message",
          chatType
        );
      } catch (error) {
        console.error("send_message error:", error);
      }
    });

    socket.on("listen_custom_offer_status", async (data: any) => {
      try {
        const { customOfferId, isAccept } = data;

        await ChatModel.findOneAndUpdate(
          { _id: customOfferId },
          { $set: { "customOffer.isAccept": isAccept } }
        );
      } catch (error) {
        console.error("listen_custom_offer_status error:", error);
      }
    });

    // 🔵 User → Admin
    socket.on(
      "send_message_to_admin",
      async ({ message }: { message: string }) => {
        try {
          const newMsg = await ChatModel.create({
            senderId: userId,
            receiverType: "admin",
            chatType: "user_admin",
            message,
          });

          io.to("ADMIN_ROOM").emit("receive_from_user", newMsg);
          socket.emit("message_sent", newMsg);
        } catch (error) {
          console.error("send_message_to_admin error:", error);
        }
      }
    );

    // 🔵 Admin → User
    socket.on(
      "admin_reply",
      async ({
        userId: targetUserId,
        message,
      }: {
        userId: string;
        message: string;
      }) => {
        try {
          const newMsg = await ChatModel.create({
            senderId: userId,
            receiverId: targetUserId,
            chatType: "user_admin",
            message,
          });

          io.to(targetUserId).emit("receive_message_from_admin", newMsg);

          const user = await User_Model.findById(targetUserId);
          await sendNotification(
            user?.fullName as string,
            "Admin replied",
            message,
            "message",
            "user_admin"
          );
        } catch (error) {
          console.error("admin_reply error:", error);
        }
      }
    );

    // 🔵 Mark message as seen
    socket.on("mark_seen", async ({ msgId }: { msgId: string }) => {
      try {
        await ChatModel.findByIdAndUpdate(msgId, { seen: true });
      } catch (error) {
        console.error("mark_seen error:", error);
      }
    });

    socket.on("disconnect", () => {
      try {
        onlineUsers.delete(userId);
        console.log("Disconnected:", socket.id);
      } catch (error) {
        console.error("disconnect error:", error);
      }
    });
  } catch (error) {
    console.error("chatSocketHandler init error:", error);
  }
};
