import dotenv from "dotenv";
import dns from "node:dns";

dotenv.config({ quiet: true });
dns.setServers(['8.8.8.8', '8.8.4.4']);