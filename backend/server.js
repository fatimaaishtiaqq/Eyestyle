import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { dropLegacyIndexes } from './utils/dropIndexes.js';
import { protect, admin } from './middleware/authMiddleware.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import subCategoryRoutes from './routes/subCategoryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import forgotPasswordRoutes from './routes/forgotPasswordRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import { initializeWhatsApp, isReady, latestQRData } from './utils/whatsappClient.js';

dotenv.config();

const app = express();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
].filter(Boolean);

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(compression());

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin || allowedOrigins[0] || true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
}));

app.use(express.json({ limit: '100kb' }));
// Phase 8: Parse httpOnly cookies for JWT auth
app.use(cookieParser());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
});

const publicLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', publicLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/firebase', authLimiter);
app.use('/api/forgot-password', authLimiter);

// Lazy DB connection middleware - connects once per serverless container lifecycle
let isConnected = false;
app.use(async (req, res, next) => {
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
            dropLegacyIndexes().catch(() => { });
        } catch (err) {
            return res.status(500).json({
                message: 'Database connection failed',
                ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
            });
        }
    }
    next();
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/home-data', homeRoutes);

// Phase 8: Logout route — clears the httpOnly JWT cookie
app.post('/api/auth/logout', (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.json({ message: 'Logged out successfully' });
});

// WhatsApp admin routes — protected in production
const whatsappGuard = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }
    return protect(req, res, () => admin(req, res, next));
};

app.get('/api/whatsapp/qr', whatsappGuard, (req, res) => {
    if (isReady) {
        return res.send(`<h2>✅ WhatsApp is already connected and ready!</h2>`);
    }
    if (!latestQRData) {
        return res.send(`<h2>⏳ Please wait... Generating QR code. Refresh in a few seconds.</h2>`);
    }

    res.send(`
        <html>
            <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background-color:#f0f2f5; font-family:sans-serif;">
                <h2>Scan this QR Code with your phone's WhatsApp</h2>
                <div style="background:white; padding:20px; border-radius:10px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                    <img src="${latestQRData}" style="width:300px; height:300px;" alt="WhatsApp QR Code" />
                </div>
            </body>
        </html>
    `);
});

app.get('/api/whatsapp/status', whatsappGuard, (req, res) => {
    res.json({
        connected: isReady,
        waitingForScan: !!latestQRData,
        message: isReady ? 'WhatsApp is fully connected!' : (latestQRData ? 'Waiting for QR scan' : 'Initializing browser...'),
    });
});

app.post('/api/whatsapp/test', whatsappGuard, async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Please provide a 'phone' number in the JSON body." });

    const { sendWhatsAppMessage } = await import('./utils/whatsappClient.js');
    const success = await sendWhatsAppMessage(phone, "🤖 *EYESTYLE SYSTEM TEST*\n\nHello! If you are seeing this, your WhatsApp Bot is successfully connected and capable of sending messages perfectly!");

    res.json({ success, message: success ? 'Test message sent!' : 'Failed to send test message. Check server logs.' });
});

app.get('/', (req, res) => {
    res.send('Luxury E-Commerce API is running...');
});

// Only start listening locally - Vercel handles this automatically in serverless
if (process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

        if (!globalThis.__WHATSAPP_BOT_INITIALIZED__) {
            globalThis.__WHATSAPP_BOT_INITIALIZED__ = true;
            initializeWhatsApp();
        }
    });
}

export default app;
