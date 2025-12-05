// backend/src/config/database.js
import mongoose from "mongoose";
import { db_name } from "../../constants.js";

const connectDB = async () => {
    try {
        // Default to local MongoDB
        const mongoURI = process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/${db_name}`;
        
        const connectionInstance = await mongoose.connect(mongoURI);
        console.log(`✅ MongoDB connected! Host: ${connectionInstance.connection.host}`);
        console.log(`📁 Database: ${connectionInstance.connection.name}`);
        console.log(`server is running at port ${process.env.PORT || 5001}`);
        
        return connectionInstance;
    } catch (error) {
        console.error("❌ MongoDB connection FAILED: ", error.message);
        console.log("💡 Make sure MongoDB is running:");
        console.log("   On macOS: brew services start mongodb-community");
        console.log("   Or run: mongod --config /usr/local/etc/mongod.conf");
        process.exit(1);
    }
};

export default connectDB;