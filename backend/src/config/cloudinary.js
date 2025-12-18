// src/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

console.log("\n=== CLOUDINARY INITIALIZATION ===");

// Function to get config - with delay to ensure env vars are loaded
const getCloudinaryConfig = () => {
    const config = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    };
    
    console.log("🔍 Cloudinary Config Check:");
    console.log("Cloud Name:", config.cloud_name || "❌ MISSING");
    console.log("API Key:", config.api_key ? "✓ PRESENT" : "❌ MISSING");
    console.log("API Secret:", config.api_secret ? "✓ PRESENT" : "❌ MISSING");
    
    return config;
};

// Initialize Cloudinary lazily
let cloudinaryInitialized = false;

const initializeCloudinary = () => {
    if (cloudinaryInitialized) return;
    
    const config = getCloudinaryConfig();
    
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
        console.error("\n⚠️ Cloudinary not configured - uploads will fail");
        console.error("Environment variables may not be loaded yet");
        return;
    }
    
    try {
        cloudinary.config(config);
        cloudinaryInitialized = true;
        console.log("\n✅ Cloudinary configured successfully!");
    } catch (error) {
        console.error("\n❌ Failed to configure Cloudinary:", error.message);
    }
};

const uploadOnCloudinary = async (localFilePath) => {
    // Initialize on first use
    if (!cloudinaryInitialized) {
        initializeCloudinary();
    }
    
    try {
        console.log("\n📤 Starting Cloudinary Upload");
        console.log("File:", localFilePath);
        
        if (!localFilePath) {
            console.log("❌ No file path provided");
            return null;
        }
        
        // Check if file exists
        if (!fs.existsSync(localFilePath)) {
            console.log("❌ File not found:", localFilePath);
            return null;
        }
        
        console.log("✅ File verified, size:", fs.statSync(localFilePath).size, "bytes");
        
        // Check if Cloudinary is configured
        if (!cloudinaryInitialized) {
            console.error("❌ Cloudinary not configured - cannot upload");
            return null;
        }
        
        // Upload to Cloudinary
        console.log("🚀 Uploading to Cloudinary...");
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "user_profiles"
        });
        
        console.log("🎉 Upload successful!");
        console.log("🔗 URL:", response.secure_url);
        
        // Clean up local file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("🗑️ Local file cleaned up");
        }
        
        return response;
        
    } catch (error) {
        console.error("\n💥 Upload failed!");
        console.error("Error:", error.message);
        
        // Clean up local file on error
        if (localFilePath && fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
                console.log("🗑️ Local file cleaned up after error");
            } catch (deleteError) {
                console.error("⚠️ Failed to delete local file:", deleteError.message);
            }
        }
        
        return null;
    }
};

const deleteFromCloudinary = async (url) => {
    if (!cloudinaryInitialized) {
        initializeCloudinary();
    }
    
    try {
        if (!url) return null;
        
        // Extract public_id from URL
        const publicId = url.split('/').pop().split('.')[0];
        
        // Delete the file
        const response = await cloudinary.uploader.destroy(publicId);
        return response;
        
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };