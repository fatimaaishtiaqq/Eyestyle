import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-[var(--color-bg-section)] border-t border-[var(--surface-border)] text-[var(--text-primary)] pt-16 pb-8 mt-auto transition-colors duration-400">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-center md:text-left">
                    {/* Brand & Info */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="font-serif text-2xl font-bold tracking-widest mb-6 uppercase">EYESTYLE</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed font-sans opacity-80 max-w-sm">
                            Exquisite luxury apparel designed for those who appreciate true craftsmanship and timeless elegance.
                        </p>
                        <div className="flex space-x-4">
                            <span className="w-8 h-8 flex items-center justify-center opacity-80 hover:text-[var(--color-electric-blue)] hover:opacity-100 cursor-pointer transition-colors text-sm">FB</span>
                            <span className="w-8 h-8 flex items-center justify-center opacity-80 hover:text-[var(--color-electric-blue)] hover:opacity-100 cursor-pointer transition-colors text-sm">TW</span>
                            <span className="w-8 h-8 flex items-center justify-center opacity-80 hover:text-[var(--color-electric-blue)] hover:opacity-100 cursor-pointer transition-colors text-sm">IG</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col items-center md:items-start">
                        <h4 className="text-sm font-serif font-semibold mb-6 uppercase text-[var(--text-primary)]">Information</h4>
                        <ul className="space-y-4">
                            <li><Link to="/about" className="text-sm text-[var(--text-muted)] hover:text-[var(--color-electric-blue)] transition-colors font-sans">About Us</Link></li>
                            <li><Link to="/sustainability" className="text-sm text-[var(--text-muted)] hover:text-[var(--color-electric-blue)] transition-colors font-sans">Sustainability</Link></li>
                            <li><Link to="/careers" className="text-sm text-[var(--text-muted)] hover:text-[var(--color-electric-blue)] transition-colors font-sans">Careers</Link></li>
                        </ul>
                    </div>

                    {/* Customer Care */}
                    <div className="flex flex-col items-center md:items-start">
                        <h4 className="text-sm font-serif font-semibold mb-6 uppercase text-[var(--text-primary)]">Customer Care</h4>
                        <ul className="space-y-4">
                            <li><Link to="/contact" className="text-sm text-[var(--text-muted)] hover:text-[var(--color-electric-blue)] transition-colors font-sans">Contact Us</Link></li>
                            <li><Link to="/shipping" className="text-sm text-[var(--text-muted)] hover:text-[var(--color-electric-blue)] transition-colors font-sans">Shipping & Returns</Link></li>
                            <li><Link to="/faq" className="text-sm text-[var(--text-muted)] hover:text-[var(--color-electric-blue)] transition-colors font-sans">FAQs</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="flex flex-col items-center md:items-start">
                        <h4 className="text-sm font-serif font-semibold mb-6 uppercase text-[var(--text-primary)]">Newsletter</h4>
                        <p className="text-sm text-[var(--text-muted)] mb-4 font-sans max-w-sm">
                            Sign up to receive 10% off your first order and exclusive updates.
                        </p>
                        <form className="flex flex-col space-y-3 w-full max-w-sm">
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-accent bg-transparent transition-colors text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans rounded-none text-center md:text-left"
                            />
                            <button
                                type="submit"
                                className="btn-cta px-4 py-3 text-sm font-sans font-semibold w-full"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[var(--surface-border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-4 md:mb-0 font-sans">
                        &copy; {new Date().getFullYear()} EYESTYLE. All rights reserved.
                    </p>
                    <div className="flex space-x-6 text-xs text-[var(--text-muted)] font-sans">
                        <Link to="/privacy" className="hover:text-[var(--color-electric-blue)] transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-[var(--color-electric-blue)] transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
