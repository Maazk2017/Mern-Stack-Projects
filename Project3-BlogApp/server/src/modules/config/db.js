import mongoose from "mongoose";

async function connectDB () {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log('MongoDB Connected');
    } catch (error) {
        console.log('Mongo DB connection error', error);
        process.exit(1);
    }
}

export default connectDB;
