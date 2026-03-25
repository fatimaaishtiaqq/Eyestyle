import pkg from 'whatsapp-web.js';
const { Client, RemoteAuth } = pkg;
import { MongoStore } from 'wwebjs-mongo';
import mongoose from 'mongoose';
import qrcode from 'qrcode'; // Real image generator

// No longer relying on ephemeral server disk space for local storage.
// Sessions will now be saved securely into MongoDB!

let whatsappClient;
export let isReady = false;
export let latestQRData = null; // Store the QR code to be served via HTTP

export const initializeWhatsApp = () => {
    // Mount MongoDB Store to save session states permanently over ephemeral reboots
    const store = new MongoStore({ mongoose: mongoose });

    whatsappClient = new Client({
        authStrategy: new RemoteAuth({
            clientId: 'eyestyle-bot',
            store: store,
            backupSyncIntervalMs: 300000 // Backup session sync every 5 minutes
        }),
        // Crucial fix: The WA web version updates frequently, causing mid-boot page navigations that instantly crash the Node process! 
        // We bypass this entirely by pinning a remote fixed version of the WhatsApp Web HTML.
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        puppeteer: {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--disable-accelerated-2d-canvas'
            ]
        }
    });

    whatsappClient.on('remote_session_saved', () => {
        console.log('✅ WhatsApp MongoDB Session securely saved/synced!');
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
    });

    whatsappClient.initialize().catch((err) => {
        console.error('WhatsApp initialization failed:', err);
        isReady = false;
    });
};

/**
 * Sends a WhatsApp message to the specified phone number via the local/Render headless browser bot.
 * @param {string} phone - The recipient phone number (should contain country code, e.g., '923085961662').
 * @param {string} message - The message text.
 * @returns {Promise<boolean>} - True if sent successfully, false otherwise.
 */
export const sendWhatsAppMessage = async (phone, message) => {
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
