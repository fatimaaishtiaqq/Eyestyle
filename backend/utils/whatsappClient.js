import path from 'path';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode'; // Real image generator
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep WhatsApp session + caches in deterministic locations.
// On platforms like Render, persisting these folders (via Persistent Disk) is important.
const AUTH_DATA_PATH = path.resolve(__dirname, '../.wwebjs_auth');
const WEB_CACHE_PATH = path.resolve(__dirname, '../.wwebjs_cache');

// Ensure write locations exist (Render sometimes mounts empty filesystem dirs).
try {
    fs.mkdirSync(AUTH_DATA_PATH, { recursive: true });
    fs.mkdirSync(WEB_CACHE_PATH, { recursive: true });
} catch (err) {
    console.error('Failed to create WhatsApp cache/auth directories:', err);
}

let whatsappClient;
export let isReady = false;
export let latestQRData = null; // Store the QR code to be served via HTTP

// Cloud API configuration (used on Vercel / serverless)
const getCloudConfig = () => {
    const token =
        process.env.WHATSAPP_CLOUD_ACCESS_TOKEN ||
        process.env.WHATSAPP_CLOUD_TOKEN ||
        '';
    const phoneId = process.env.WHATSAPP_CLOUD_PHONE_ID || '';
    return { token, phoneId, useCloudApi: !!(token && phoneId) };
};

export const initializeWhatsApp = () => {
    // Do not initialize the headless client in serverless / Vercel; it needs a long‑running process.
    if (process.env.VERCEL === '1') {
        console.log('WhatsApp Web client initialization skipped on Vercel; using Cloud API if configured.');
        return;
    }

    // LocalAuth saves the session so we don't need to scan the QR code on every server restart
    whatsappClient = new Client({
        authStrategy: new LocalAuth({
            dataPath: AUTH_DATA_PATH,
        }),
        // Prevent Render crashes caused by remote web version caching configuration.
        // whatsapp-web.js can throw: "webVersionCache.remotePath is required when using the remote cache"
        // if it ends up using remote caching.
        webVersionCache: {
            type: 'local',
            path: WEB_CACHE_PATH,
        },
        puppeteer: {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run'
            ]
        }
    });

    whatsappClient.on('qr', async (qr) => {
        try {
            // Generate a real Base64 image
            latestQRData = await qrcode.toDataURL(qr);
            console.log('\n--- SCAN THIS QR CODE IN WHATSAPP TO LINK BOT ---');
            // Render/Render-like platforms expose a public URL; fallback to localhost for local dev.
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
    });

    whatsappClient.on('ready', () => {
        console.log('✅ WhatsApp Web Client is Ready!');
        isReady = true;
        latestQRData = null; // Clear the QR once authenticated
    });

    whatsappClient.on('auth_failure', () => {
        console.error('❌ WhatsApp Web Authentication Failed!');
        isReady = false;
    });

    whatsappClient.on('disconnected', (reason) => {
        console.log('❌ WhatsApp Web Client Disconnected:', reason);
        isReady = false;
        // Optionally, try to reinitialize here
    });

    whatsappClient.initialize().catch((err) => {
        console.error('WhatsApp initialization failed:', err);
        isReady = false;
    });
};

/**
 * Sends a WhatsApp message to the specified phone number.
 * @param {string} phone - The recipient phone number (should contain country code, e.g., '923085961662').
 * @param {string} message - The message text.
 * @returns {Promise<boolean>} - True if sent successfully, false otherwise.
 */
// Send using official WhatsApp Cloud API (recommended for Vercel / production)
const sendViaCloudApi = async (phone, message) => {
    try {
        const { token, phoneId, useCloudApi } = getCloudConfig();

        if (!useCloudApi) {
            console.error('WhatsApp Cloud API is not configured (missing WHATSAPP_CLOUD_TOKEN or WHATSAPP_CLOUD_PHONE_ID).');
            return false;
        }

        const formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone) {
            console.error('Cannot send WhatsApp Cloud message: phone number is empty after formatting.');
            return false;
        }

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
            const text = await res.text().catch(() => '');
            console.error('WhatsApp Cloud API error:', res.status, text);
            return false;
        }

        console.log(`WhatsApp Cloud message sent to ${phone}`);
        return true;
    } catch (err) {
        console.error('Failed to send WhatsApp Cloud message:', err);
        return false;
    }
};

export const sendWhatsAppMessage = async (phone, message) => {
    // On Vercel / production, prefer Cloud API if configured
    const { useCloudApi } = getCloudConfig();
    if (process.env.VERCEL === '1' || useCloudApi) {
        return sendViaCloudApi(phone, message);
    }

    if (!isReady || !whatsappClient) {
        console.error('Cannot send message: WhatsApp client is not ready.');
        return false;
    }

    try {
        // Format the phone number (whatsapp-web.js expects <number>@c.us)
        // Ensure no '+' sign or spaces
        let formattedPhone = phone.replace(/\D/g, '');
        
        // Auto-fix Pakistani local numbers (e.g., 03196200962 -> 923196200962)
        // This ensures local clients don't accidentally fail to receive messages!
        if (formattedPhone.startsWith('03') && formattedPhone.length === 11) {
            formattedPhone = '92' + formattedPhone.substring(1);
        }
        if (!formattedPhone) {
            console.error('Cannot send message: phone number is empty after formatting.');
            return false;
        }
        const chatId = `${formattedPhone}@c.us`;

        await whatsappClient.sendMessage(chatId, message);
        console.log(`WhatsApp message sent to ${phone} `);
        return true;
    } catch (error) {
        console.error(`Failed to send WhatsApp message to ${phone}: `, error);
        return false;
    }
};
