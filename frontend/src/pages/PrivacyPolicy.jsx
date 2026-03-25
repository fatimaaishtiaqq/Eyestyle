import React from 'react';
import ThreeBackground from '../components/ThreeBackground';

const PrivacyPolicy = () => {
    const sections = [
        {
            title: 'Information We Collect',
            content: 'We collect information you provide directly to us, including your name, email address, shipping address, phone number, and payment information when you create an account, place an order, or contact us. We also automatically collect certain information about your device and browsing activity when you visit our website.'
        },
        {
            title: 'How We Use Your Information',
            content: 'We use the information we collect to process and fulfill your orders, communicate with you about products and services, personalize your shopping experience, improve our website and services, and comply with legal obligations. We do not sell your personal information to third parties.'
        },
        {
            title: 'Information Sharing',
            content: 'We may share your information with trusted service providers who help us operate our business, including payment processors, shipping carriers, and marketing platforms. These partners are contractually obligated to protect your information and may only use it for the purposes we specify.'
        },
        {
            title: 'Data Security',
            content: 'We implement industry-standard security measures to protect your personal information, including SSL encryption, secure payment processing, and regular security audits. While we take every precaution to safeguard your data, no method of transmission over the internet is 100% secure.'
        },
        {
            title: 'Cookies & Tracking',
            content: 'Our website uses cookies and similar technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can manage your cookie preferences through your browser settings. Disabling cookies may affect certain functionality of our website.'
        },
        {
            title: 'Your Rights',
            content: 'You have the right to access, correct, or delete your personal information at any time. You may also opt out of marketing communications by following the unsubscribe instructions in our emails or by contacting our support team. Requests will be processed within 30 business days.'
        },
        {
            title: 'Contact Us',
            content: 'If you have any questions about this Privacy Policy or our data practices, please contact us at support@eyestyle.com or write to us at 123 Vision Way, New York, NY 10001.'
        }
    ];

    return (
        <div className="w-full min-h-screen pt-10 sm:pt-12 pb-20 px-4 sm:px-6 lg:px-10 text-[var(--text-primary)] relative bg-transparent">
            <ThreeBackground variant="collection" />

            <div className="max-w-[800px] mx-auto relative z-10">
                <div className="mb-6 border-b border-[var(--surface-border)] pb-4">
                    <h1 className="text-2xl sm:text-[28px] font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">
                        Privacy Policy
                    </h1>
                    <p className="text-[12px] text-[var(--text-secondary)] tracking-wider mt-1">
                        Last updated: March 2026
                    </p>
                </div>

                <div className="space-y-5">
                    {sections.map((section, idx) => (
                        <div key={idx} className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-5 sm:p-6">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">
                                {section.title}
                            </h2>
                            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
