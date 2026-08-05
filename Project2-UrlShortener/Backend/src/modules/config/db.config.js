import mongoose from "mongoose";

async function ConnectDB () {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log("MongoDB Connected");
    } catch (error) {
        console.log(`MongoDB connection Error: ${error}`);
    }
}

export default ConnectDB;