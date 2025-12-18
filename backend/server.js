// server.js - UPDATED VERSION
// ============ LOAD ENVIRONMENT VARIABLES FIRST ============
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the root directory
const envPath = path.resolve(__dirname, ".env");
console.log("📁 Loading .env from:", envPath);

const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
    console.error("❌ Failed to load .env file:", envResult.error);
    // Try current working directory as fallback
    const fallbackPath = path.resolve(process.cwd(), ".env");
    console.log("🔄 Trying fallback path:", fallbackPath);
    dotenv.config({ path: fallbackPath });
}

// ============ VERIFY CRITICAL ENV VARIABLES ============
console.log("\n🔍 VERIFYING ENVIRONMENT VARIABLES:");
console.log("=".repeat(50));

const requiredVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY", 
    "CLOUDINARY_API_SECRET",
    "MONGODB_URI"
];

let allVarsPresent = true;
requiredVars.forEach(variable => {
    const value = process.env[variable];
    const isPresent = value && value.trim() !== "";
    console.log(`${isPresent ? "✅" : "❌"} ${variable}:`, isPresent ? "SET" : "NOT SET");
    if (!isPresent) allVarsPresent = false;
});

console.log("=".repeat(50));

if (!allVarsPresent) {
    console.error("\n🚨 Missing required environment variables!");
    console.error("💡 Check your .env file exists and has all required variables.");
    console.error("💡 Current working directory:", process.cwd());
    console.error("💡 .env path tried:", envPath);
    process.exit(1);
}

console.log("✅ All environment variables loaded successfully!\n");

// ============ NOW IMPORT THE REST ============
import app from './app.js';
import connectDB from './src/config/database.js';

const PORT = process.env.PORT || 5000;

// ============ START SERVER ============
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });
    })
    .catch((error) => {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    });

// ============ GRACEFUL SHUTDOWN ============
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT received. Shutting down gracefully...');
    process.exit(0);
});