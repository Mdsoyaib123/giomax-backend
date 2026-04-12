import { RtcRole, RtcTokenBuilder } from "agora-access-token";

const APP_ID = process.env.AGORA_APP_ID!;
const APP_CERT = process.env.AGORA_APP_CERT!;

export const generateAgoraToken = (
  channelName: string,
  uid: number
): string => {
  if (!APP_ID || !APP_CERT) {
    throw new Error("Agora APP_ID or APP_CERT missing");
  }

  if (uid <= 0) {
    throw new Error("Agora uid must be greater than 0");
  }

  console.log("channel name ", channelName);
  console.log("uid ", uid);

  const role = RtcRole.PUBLISHER;

  // Token valid for 24 hours
  const expireDurationInSeconds = 24 * 60 * 60;

  // ✅ Absolute timestamp (seconds since epoch)
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireDurationInSeconds;

  console.log("privilegeExpiredTs ", privilegeExpiredTs);

  return RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERT,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
};
