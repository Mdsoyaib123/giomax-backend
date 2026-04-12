import axios from "axios";
import qs from "qs";

const CLIENT_ID = process.env.BOG_CLIENT_ID;
const CLIENT_SECRET = process.env.BOG_CLIENT_SECRET;

console.log('client id ', CLIENT_ID,CLIENT_SECRET);

export async function getAccessToken() {
  const response = await axios.post(
    "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token",
    qs.stringify({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
}
