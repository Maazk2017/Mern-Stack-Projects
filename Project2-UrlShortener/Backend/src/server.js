import "dotenv/config";
import app from "./app.js";
import dns from "dns";
import ConnectDB from "./modules/config/db.config.js";

dns.setServers(['8.8.8.8', '8.8.4.4']);

ConnectDB();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port: ${process.env.PORT}`);
});