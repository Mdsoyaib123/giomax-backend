import mongoose from "mongoose";
import http from "http";
import app from "./app";
import { configs } from "./app/configs";
import { initSocket } from "./socket/initSocket";
import 'dotenv/config';


async function main() {
  try {
    await mongoose.connect(configs.db_url!);
    console.log("MongoDB connected");

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initSocket(server);

    // Start server
    server.listen(configs.port, () => {
      console.log(`🚀 Server running on port ${configs.port}`);
    });
  } catch (err) {
    console.log("❌ Error:", err);
  }
}

main();

