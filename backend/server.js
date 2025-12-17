import dotenv from "dotenv";
import connectDB from "./src/config/database.js";
import app from "./app.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5001;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Server is running at port: ${PORT}`);
            console.log(`🌐 Visit: http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed:", err);
        process.exit(1);
    });