import React from 'react';
import ThreeBackground from '../components/ThreeBackground';

const TermsOfService = () => {
    const sections = [
        {
            title: 'Acceptance of Terms',
            content: 'By accessing and using the Eyestyle website, you accept and agree to be bound by the terms and conditions outlined in this agreement. If you do not agree to these terms, please do not use our website or services.'
        },
        {
            title: 'Products & Pricing',
            content: 'All products listed on our website are subject to availability. We reserve the right to modify prices, descriptions, and product availability at any time without prior notice. Prices are displayed in USD and are inclusive of applicable taxes unless stated otherwise.'
        },
        {
            title: 'Orders & Payment',
            content: 'By placing an order, you are submitting a binding offer to purchase the selected products. We reserve the right to cancel or refuse any order for any reason, including pricing errors, product unavailability, or suspected fraudulent activity. Payment is processed securely at the time of checkout.'
        },
        {
            title: 'Shipping & Delivery',
            content: 'We aim to dispatch all orders within 1-3 business days. Delivery times vary depending on your location and selected shipping method. We are not responsible for delays caused by customs, weather, or carrier issues. Please refer to our Shipping & Returns page for detailed information.'
        },
        {
            title: 'Returns & Refunds',
            content: 'We offer a 30-day return policy for items in their original, unused condition with all tags and packaging intact. Refunds will be processed within 5-10 business days after we receive and inspect the returned item. Shipping costs for returns are the responsibility of the customer unless the item is defective.'
        },
        {
            title: 'Intellectual Property',
            content: 'All content on this website, including text, graphics, logos, images, and software, is the property of Eyestyle and is protected by international copyright and trademark laws. You may not reproduce, distribute, or create derivative works from our content without prior written consent.'
        },
        {
            title: 'Limitation of Liability',
            content: 'Eyestyle shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our website or products. Our total liability for any claim related to our products or services shall not exceed the amount you paid for the specific product in question.'
        },
        {
            title: 'Changes to Terms',
            content: 'We reserve the right to update these terms at any time. Changes will be posted on this page and will take effect immediately. Continued use of our website after any changes constitutes acceptance of the revised terms.'
        }
    ];

    return (
        <div className="w-full min-h-screen pt-10 sm:pt-12 pb-20 px-4 sm:px-6 lg:px-10 text-[var(--text-primary)] relative bg-transparent">
            <ThreeBackground variant="collection" />

            <div className="max-w-[800px] mx-auto relative z-10">
                <div className="mb-6 border-b border-[var(--surface-border)] pb-4">
                    <h1 className="text-2xl sm:text-[28px] font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">
                        Terms of Service
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

export default TermsOfService;
