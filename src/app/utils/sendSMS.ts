const https = require("https");
const querystring = require("querystring");

const API_KEY = process.env.SENDER_API_KEY; // NEVER hardcode in production

interface SendSMSParams {
  phone: string;
  message: string;
  smsType?: number;
  priority?: number;
}

function sendSMS({ phone, message, smsType = 2, priority = 0 }: SendSMSParams) {
  return new Promise((resolve, reject) => {
    if (!phone || !message) {
      return reject(new Error("Phone and message are required"));
    }

    // Georgian format validation (9 digits only)
    if (!/^\d{9}$/.test(phone)) {
      return reject(new Error("Phone must be 9 digits (without +995)"));
    }

    const postData = querystring.stringify({
      apikey: API_KEY,
      smsno: smsType, // 2 = informational (OTP)
      destination: phone,
      content: message,
      priority: priority,
    });

    const options = {
      hostname: "sender.ge",
      path: "/api/send.php",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 10000, // 10 sec timeout
    };

    const req = https.request(options, (res: any) => {
      let body = "";

      res.on("data", (chunk: any) => {
        body += chunk;
      });

      res.on("end", () => {
        let parsed;

        try {
          parsed = JSON.parse(body);
        } catch (err) {
          return reject(new Error("Invalid JSON response from Sender"));
        }

        // Handle HTTP errors
        if (res.statusCode !== 200) {
          return reject({
            statusCode: res.statusCode,
            error: parsed.message || "Sender API Error",
          });
        }

        // Validate success response structure
        if (!parsed.data || !parsed.data[0]) {
          return reject(new Error("Unexpected API response structure"));
        }

        const smsData = parsed.data[0];

        resolve({
          success: smsData.statusId === 1,
          messageId: smsData.messageId,
          quantity: smsData.qnt,
          statusId: smsData.statusId,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Sender API request timeout"));
    });

    req.on("error", (err: any) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

export { sendSMS };
