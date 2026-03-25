import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { dropLegacyIndexes } from './utils/dropIndexes.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import subCategoryRoutes from './routes/subCategoryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { initializeWhatsApp, isReady, latestQRData } from './utils/whatsappClient.js';

dotenv.config();

const app = express();

// Vercel Serverless Dynamic CORS Configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins dynamically but reflect the exact requested origin back
        // This solves Vercel's strict CORS preflight rejections
        callback(null, origin || true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

app.use(express.json());

// Lazy DB connection middleware - connects once per serverless container lifecycle
let isConnected = false;
app.use(async (req, res, next) => {
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
            // Drop legacy indexes only once after first connection
            dropLegacyIndexes().catch(() => { });
        } catch (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err.message });
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

// Helper route to visually display the QR code for easier scanning
app.get('/api/whatsapp/qr', (req, res) => {
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

app.get('/', (req, res) => {
    res.send('Luxury E-Commerce API is running...');
});

// Only start listening locally - Vercel handles this automatically in serverless
if (process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

        // Initialize the WhatsApp Web Client Bot whenever the server starts.
        // Wrap in try/catch so a WhatsApp failure does not crash the entire API server.
        try {
            initializeWhatsApp();
        } catch (err) {
            console.error('Failed to initialize WhatsApp client:', err);
        }
    });
}

// Export for Vercel Serverless
export default app;
