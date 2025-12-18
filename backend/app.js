// src/app.js - SIMPLIFIED VERSION
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import serviceRoutes from './src/routes/service.routes.js';
import bookingRoutes from './src/routes/booking.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import sellWasteRoutes from './src/routes/sellWaste.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';

const app = express();

// ============ MIDDLEWARE ============
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

// ============ ROUTES ============
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use('/api/v1/sell-waste', sellWasteRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'Composting Platform API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============ ROOT ROUTE ============
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to Composting Platform API',
        version: '1.0.0'
    });
});

// ============ ERROR HANDLERS ============
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err.message);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

export default app;