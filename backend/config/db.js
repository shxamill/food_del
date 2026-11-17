import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI).then(() => console.log("DB Connected"));
}

// Set MONGO_URI in backend/.env (see backend/.env.example).
