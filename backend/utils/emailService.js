import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production') {
    console.warn('[email] RESEND_API_KEY is not set — emails will not send.');
}
const resend = new Resend(process.env.RESEND_API_KEY || '');
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const STORE_NAME = 'Eyestyle';

/**
 * Sends an order confirmation email when the order is successfully placed.
 */
export const sendOrderConfirmation = async (order, customerEmail, customerName = 'Customer') => {
    try {
        if (!customerEmail) return;
        
        const shortOrderId = order._id.toString().substring(18);
        const totalAmount = Number(order.totalPrice || 0).toFixed(2);
        
        const itemsListHtml = order.orderItems.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <span style="font-weight: bold;">${item.name}</span><br/>
                    <span style="color: #666; font-size: 12px;">Qty: ${item.qty}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    Rs. ${Number(item.price * item.qty).toFixed(2)}
                </td>
            </tr>
        `).join('');

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h1 style="text-align: center; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">${STORE_NAME}</h1>
                <p>Hello ${customerName},</p>
                <p>Thank you for your order! We've received it and will start processing it shortly.</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Order Summary (#${shortOrderId})</h3>
                    <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                    <p><strong>Order Source:</strong> ${order.orderSource || 'Web'}</p>
                    
                    <h4 style="margin-bottom: 10px;">Items Ordered</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${itemsListHtml}
                        <tr>
                            <td style="padding: 10px; font-weight: bold; text-align: right;">Total</td>
                            <td style="padding: 10px; font-weight: bold; text-align: right;">Rs. ${totalAmount}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin: 20px 0;">
                    <h4 style="margin-bottom: 5px;">Delivery Details</h4>
                    <p style="margin: 0; color: #666;">
                        ${order.shippingAddress.address}<br/>
                        ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}<br/>
                        ${order.shippingAddress.country}<br/>
                        Phone: ${order.shippingAddress.phone || order.phoneNumber}
                    </p>
                </div>
                
                <p>If you have any questions, reply to this email. We're here to help!</p>
                <p>Best regards,<br/>The ${STORE_NAME} Team</p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: `${STORE_NAME} <${EMAIL_FROM}>`,
            to: customerEmail,
            subject: `Order Confirmation - #${shortOrderId}`,
            html: html,
        });
        
        if (error) {
            console.error('[Email Service] Error from Resend API:', error);
            return null;
        }

        console.log(`[Email Service] Order confirmation sent to ${customerEmail}. ID: ${data?.id}`);
        return data;
    } catch (error) {
        console.error('[Email Service] Failed to send order confirmation:', error);
    }
};

/**
 * Sends an email when the order status is updated by the admin.
 */
export const sendOrderStatusUpdate = async (order, customerEmail, customerName = 'Customer', newStatus) => {
    try {
        if (!customerEmail) return;
        
        const shortOrderId = order._id.toString().substring(18);
        
        let statusMessage = '';
        if (newStatus === 'processing') {
            statusMessage = 'Your order is now being processed and is being prepared for shipment.';
        } else if (newStatus === 'shipped') {
            statusMessage = 'Great news! Your order has been shipped and is on its way to you.';
        } else if (newStatus === 'delivered') {
            statusMessage = 'Your order has been delivered! We hope you enjoy your purchase.';
        } else if (newStatus === 'cancelled') {
            statusMessage = 'We are sorry to inform you that your order has been cancelled.';
        } else {
            statusMessage = `Your order status has been updated to: ${newStatus}`;
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h1 style="text-align: center; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">${STORE_NAME}</h1>
                <p>Hello ${customerName},</p>
                <p>There's an update regarding your order <strong>#${shortOrderId}</strong>.</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #333;">
                    <h3 style="margin-top: 0; text-transform: uppercase;">Status: ${newStatus}</h3>
                    <p style="margin-bottom: 0;">${statusMessage}</p>
                </div>
                
                <p>If you have any questions, reply to this email. We're here to help!</p>
                <p>Best regards,<br/>The ${STORE_NAME} Team</p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: `${STORE_NAME} <${EMAIL_FROM}>`,
            to: customerEmail,
            subject: `Order Update - #${shortOrderId}`,
            html: html,
        });
        
        if (error) {
            console.error('[Email Service] Error from Resend API:', error);
            return null;
        }

        console.log(`[Email Service] Status update email sent to ${customerEmail}. ID: ${data?.id}`);
        return data;
    } catch (error) {
        console.error('[Email Service] Failed to send status update:', error);
    }
};

/**
 * Sends a restock notification when a product comes back in stock.
 */
export const sendRestockNotification = async (email, product) => {
    try {
        if (!email) return;
        
        const productUrl = `${FRONTEND_URL}/product/${product._id}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h1 style="text-align: center; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">${STORE_NAME}</h1>
                <p>Great news!</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <h2 style="margin-bottom: 10px;">${product.name} is back in stock!</h2>
                    <p style="color: #666; margin-bottom: 25px;">You asked us to notify you when this item became available again.</p>
                    
                    <a href="${productUrl}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 15px 30px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; font-size: 14px;">
                        View Product
                    </a>
                </div>
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    You are receiving this email because you opted in to be notified about this product's availability.
                </p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: `${STORE_NAME} <${EMAIL_FROM}>`,
            to: email,
            subject: `Back in Stock: ${product.name}`,
            html: html,
        });
        
        if (error) {
            console.error('[Email Service] Error from Resend API:', error);
            return null;
        }

        console.log(`[Email Service] Restock notification sent to ${email}. ID: ${data?.id}`);
        return data;
    } catch (error) {
        console.error('[Email Service] Failed to send restock notification:', error);
    }
};

/**
 * Sends a password reset OTP email.
 */
export const sendPasswordResetOTP = async (email, otp, customerName = 'Customer') => {
    try {
        if (!email) return;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h1 style="text-align: center; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">${STORE_NAME}</h1>
                <p>Hello ${customerName},</p>
                <p>We received a request to reset the password for your account. Use the code below to proceed:</p>

                <div style="background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin: 25px 0; text-align: center; border-left: 4px solid #ff9800;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #666;">Your Verification Code</p>
                    <h2 style="margin: 0; font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #000;">${otp}</h2>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This code expires in <strong>10 minutes</strong>.</p>
                </div>

                <p style="font-size: 13px; color: #666; line-height: 1.6;">
                    If you did not request a password reset, please ignore this email. Your password will remain unchanged and your account is safe.
                </p>
                <p style="font-size: 13px; color: #666; line-height: 1.6;">
                    For security reasons, never share this code with anyone. ${STORE_NAME} will never ask for your code via phone or chat.
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                <p style="font-size: 11px; color: #999; text-align: center;">
                    This is an automated email from ${STORE_NAME}. Please do not reply.
                </p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: `${STORE_NAME} <${EMAIL_FROM}>`,
            to: email,
            subject: `${STORE_NAME} — Password Reset Code`,
            html: html,
        });

        if (error) {
            console.error('[Email Service] Error from Resend API:', error);
            return null;
        }

        console.log(`[Email Service] Password reset OTP sent to ${email}. ID: ${data?.id}`);
        return data;
    } catch (error) {
        console.error('[Email Service] Failed to send password reset OTP:', error);
    }
};

/**
 * Sends a confirmation email after password is successfully changed.
 */
export const sendPasswordResetConfirmation = async (email, customerName = 'Customer') => {
    try {
        if (!email) return;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h1 style="text-align: center; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">${STORE_NAME}</h1>
                <p>Hello ${customerName},</p>
                <p>Your password has been successfully changed.</p>

                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #22c55e;">
                    <p style="margin: 0; font-weight: bold; color: #166534;">✓ Password Updated Successfully</p>
                    <p style="margin: 8px 0 0 0; font-size: 13px; color: #166534;">You can now sign in with your new password.</p>
                </div>

                <p style="font-size: 13px; color: #666; line-height: 1.6;">
                    If you did not make this change, please contact our support team immediately or reset your password again.
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                <p style="font-size: 11px; color: #999; text-align: center;">
                    This is an automated email from ${STORE_NAME}. Please do not reply.
                </p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: `${STORE_NAME} <${EMAIL_FROM}>`,
            to: email,
            subject: `${STORE_NAME} — Password Changed Successfully`,
            html: html,
        });

        if (error) {
            console.error('[Email Service] Error from Resend API:', error);
            return null;
        }

        console.log(`[Email Service] Password reset confirmation sent to ${email}. ID: ${data?.id}`);
        return data;
    } catch (error) {
        console.error('[Email Service] Failed to send password reset confirmation:', error);
    }
};

