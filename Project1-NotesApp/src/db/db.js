import mongoose from "mongoose";

async function connectDB () {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/NOTES`);
        console.log('DB connected');
    } catch (error) {
        console.log('MongoDB connection error: ', error);
    }
}

export default connectDB;