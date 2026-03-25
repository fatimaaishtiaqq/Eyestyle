import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode';
import connectDB from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DATA_PATH = path.resolve(__dirname, '../.baileys_auth');

// MongoDB Schema for storing Baileys JSON state securely across ephemeral server restarts
const AuthBackupSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    files: { type: mongoose.Schema.Types.Mixed, default: {} } // Pure JS Object to prevent Mongoose ES6 Map truncation 
});
const AuthBackup = mongoose.models.WhatsAppAuthBackup || mongoose.model('WhatsAppAuthBackup', AuthBackupSchema);

const ensureDB = async () => {
    if (mongoose.connection.readyState !== 1) {
        await connectDB();
    }
};

const backupAuthToMongo = async () => {
    if (!fs.existsSync(AUTH_DATA_PATH)) return;
    await ensureDB();
    const filesObj = {};
    try {
        const files = fs.readdirSync(AUTH_DATA_PATH);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(AUTH_DATA_PATH, file);
                try {
                    filesObj[file] = fs.readFileSync(filePath, 'utf8');
                } catch(e) {}
            }
        }
        await AuthBackup.findByIdAndUpdate('baileys_session', { files: filesObj }, { upsert: true });
        // Silently succeeded backup
    } catch (err) {
        console.error('Failed to backup Auth to Mongo:', err);
    }
};

const restoreAuthFromMongo = async () => {
    await ensureDB();
    try {
        const doc = await AuthBackup.findById('baileys_session');
        if (doc && doc.files && Object.keys(doc.files).length > 0) {
            if (!fs.existsSync(AUTH_DATA_PATH)) {
                fs.mkdirSync(AUTH_DATA_PATH, { recursive: true });
            }
            for (const [filename, content] of Object.entries(doc.files)) {
                fs.writeFileSync(path.join(AUTH_DATA_PATH, filename), content);
            }
            console.log('📦 Baileys session perfectly restored from MongoDB.');
            return true;
        }
    } catch (err) {
        console.error('Failed to restore Auth from Mongo:', err);
    }
    return false;
};

export let isReady = false;
export let latestQRData = null;
let sock;

export const initializeWhatsApp = async () => {
    if (process.env.VERCEL === '1') {
        console.log('Baileys Web client skipped on Vercel');
        return;
    }

    // Always attempt to restore from MongoDB if the local Render container was wiped
    if (!fs.existsSync(AUTH_DATA_PATH)) {
        await restoreAuthFromMongo();
        if (!fs.existsSync(AUTH_DATA_PATH)) {
            fs.mkdirSync(AUTH_DATA_PATH, { recursive: true });
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DATA_PATH);
    const { version } = await fetchLatestBaileysVersion();
    
    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), // Hide extremely aggressive Baileys debug logs
        browser: ['Eyestyle Order Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', async () => {
        await saveCreds();
        // Backup vital credentials directly to MongoDB securely
        await backupAuthToMongo();
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            try {
                latestQRData = await qrcode.toDataURL(qr);
                console.log('\n--- SCAN THIS QR CODE IN WHATSAPP TO LINK BOT ---');
                const port = process.env.PORT || 5000;
                const renderExternalUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVICE_URL || `http://localhost:${port}`;
                console.log(`📌 PLEASE GO TO: ${renderExternalUrl.replace(/\/$/, '')}/api/whatsapp/qr`);
                console.log('--------------------------------------------------\n');
            } catch (err) {
                console.error('Failed to generate QR image', err);
            }
        }

        if (connection === 'close') {
            isReady = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log('❌ WhatsApp connection closed. Reconnecting:', shouldReconnect);
            
            if (shouldReconnect) {
                setTimeout(() => initializeWhatsApp(), 3000);
            } else {
                console.log('User manually logged out in their phone app! Deleting old auth files...');
                if (fs.existsSync(AUTH_DATA_PATH)) fs.rmSync(AUTH_DATA_PATH, { recursive: true, force: true });
                try {
                    await AuthBackup.deleteOne({ _id: 'baileys_session' });
                } catch(err) {}
                latestQRData = null;
                setTimeout(() => initializeWhatsApp(), 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ Lightweight Baileys Web Client is magically Ready!');
            isReady = true;
            latestQRData = null;
            // Backup the completed open session payload to MongoDB
            await backupAuthToMongo();
        }
    });
};

/**
 * Strict Message Queue to prevent Concurrent MAC Encryption Collisions and Anti-Spam Drops
 */
let messageQueue = [];
let isSending = false;

const processQueue = async () => {
    if (isSending || messageQueue.length === 0) return;
    isSending = true;
    
    const { jid, message, phone, resolve } = messageQueue.shift();
    try {
        await sock.sendMessage(jid, { text: message });
        console.log(`✅ Pure Socket WhatsApp message safely delivered to ${phone}!`);
        resolve(true);
    } catch (err) {
        console.error(`❌ Failed to send Baileys message to ${phone}: `, err);
        resolve(false);
    }
    
    // Crucial 2-second mandatory cooldown between messages to prevent WhatsApp auto-logout drops
    setTimeout(() => {
        isSending = false;
        processQueue();
    }, 2000);
};

export const sendWhatsAppMessage = async (phone, message) => {
    if (!isReady || !sock) {
        console.error('Cannot send message: Baileys socket is not ready yet.');
        return false;
    }

    let formattedPhone = phone.replace(/\D/g, '');
    
    if (formattedPhone.startsWith('03') && formattedPhone.length === 11) {
        formattedPhone = '92' + formattedPhone.substring(1);
    }
    if (!formattedPhone) {
        console.error('Phone length is invalid after stripping.');
        return false;
    }
    
    const jid = `${formattedPhone}@s.whatsapp.net`;

    return new Promise((resolve) => {
        messageQueue.push({ jid, message, phone, resolve });
        processQueue();
    });
};
