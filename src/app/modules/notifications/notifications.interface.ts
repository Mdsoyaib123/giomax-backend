
export interface INotification {
  userId: string; // Reference to User ID
  title: string;
  body: string;
  notificationType: "notification" | "call" | "message";
  userProfile?: string;
  timestamp: Date;
  isRead?: boolean; // optional: track if the user has seen it
}
