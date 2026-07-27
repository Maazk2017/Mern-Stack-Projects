import "dotenv/config";
import dns from "node:dns";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";

dns.setServers(['8.8.8.8', '8.8.4.4']);

connectDB();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port: ${process.env.PORT}`)
});