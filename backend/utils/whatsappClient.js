import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DATA_PATH = path.resolve(__dirname, '../.baileys_auth');

export let isReady = false;
export let latestQRData = null;
let sock;

// Cloud API configuration (used on Vercel / serverless)
const getCloudConfig = () => {
    const token =
        process.env.WHATSAPP_CLOUD_ACCESS_TOKEN ||
        process.env.WHATSAPP_CLOUD_TOKEN ||
        '';
    const phoneId = process.env.WHATSAPP_CLOUD_PHONE_ID || '';
    return { token, phoneId, useCloudApi: !!(token && phoneId) };
};

export const initializeWhatsApp = async () => {
    // Do not initialize the local socket client on Vercel; it needs a persistent process.
    if (process.env.VERCEL === '1') {
        console.log('Baileys Web client skipped on Vercel; using Cloud API if configured.');
        return;
    }

    // Ensures auth storage exists locally. 
    // Render will store this until Manual Deploy, acting identically to physical memory!
    if (!fs.existsSync(AUTH_DATA_PATH)) {
        fs.mkdirSync(AUTH_DATA_PATH, { recursive: true });
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

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            try {
                latestQRData = await qrcode.toDataURL(qr);
                console.log('\n--- SCAN THIS QR CODE IN WHATSAPP TO LINK BOT ---');
                const renderExternalUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVICE_URL || '';
                const port = process.env.PORT || 5000;
                const qrUrl = renderExternalUrl
                    ? `${renderExternalUrl.replace(/\/$/, '')}/api/whatsapp/qr`
                    : `http://localhost:${port}/api/whatsapp/qr`;
                console.log(`📌 PLEASE GO TO: ${qrUrl}`);
                console.log('--------------------------------------------------\n');
            } catch (err) {
                console.error('Failed to generate QR image', err);
            }
        }

        if (connection === 'close') {
            isReady = false;
            // 401 corresponds to "loggedOut"
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log('❌ WhatsApp connection closed. Reconnecting:', shouldReconnect);
            
            if (shouldReconnect) {
                setTimeout(() => initializeWhatsApp(), 3000);
            } else {
                console.log('User manually logged out in their phone app! Deleting old auth files...');
                if (fs.existsSync(AUTH_DATA_PATH)) {
                    fs.rmSync(AUTH_DATA_PATH, { recursive: true, force: true });
                }
                latestQRData = null;
                setTimeout(() => initializeWhatsApp(), 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ Lightweight Baileys Web Client is magically Ready!');
            isReady = true;
            latestQRData = null;
        }
    });
};

/**
 * Sends using official WhatsApp Cloud API (recommended for Vercel / production)
 */
const sendViaCloudApi = async (phone, message) => {
    try {
        const { token, phoneId, useCloudApi } = getCloudConfig();

        if (!useCloudApi) {
            console.error('WhatsApp Cloud API is not configured.');
            return false;
        }

        const formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone) return false;

        const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'text',
                text: { body: message },
            }),
        });

        if (!res.ok) {
            console.error('WhatsApp Cloud API error:', res.status);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Failed to send WhatsApp Cloud message:', err);
        return false;
    }
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

/**
 * Main export: Instantly formats phone number correctly and queues it for safe sending.
 */
export const sendWhatsAppMessage = async (phone, message) => {
    // Vercel fallback checks
    const { useCloudApi } = getCloudConfig();
    if (process.env.VERCEL === '1' || useCloudApi) {
        return sendViaCloudApi(phone, message);
    }

    if (!isReady || !sock) {
        console.error('Cannot send message: Baileys socket is not ready yet.');
        return false;
    }

    // Format the phone number cleanly
    let formattedPhone = phone.replace(/\D/g, '');
    
    // Auto-fix Pakistani local numbers beautifully (e.g., 03196200962 -> 923196200962)
    if (formattedPhone.startsWith('03') && formattedPhone.length === 11) {
        formattedPhone = '92' + formattedPhone.substring(1);
    }
    if (!formattedPhone) {
        console.error('Phone length is invalid after stripping.');
        return false;
    }
    
    // Native WhatsApp Web API strings end in @s.whatsapp.net natively
    const jid = `${formattedPhone}@s.whatsapp.net`;

    // Add to the queue and wait for resolution
    return new Promise((resolve) => {
        messageQueue.push({ jid, message, phone, resolve });
        processQueue();
    });
};
