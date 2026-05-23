import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../utils/apiClient';
import { 
    Check, 
    X, 
    Trash2, 
    MessageCircle, 
    Star, 
    ShieldCheck, 
    ShieldAlert, 
    MessageSquare, 
    ArrowRight,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminTableSkeleton from '../../components/skeletons/AdminTableSkeleton';

const ReviewsList = () => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const { data: reviewsData, isLoading: loading } = useQuery({
        queryKey: ['admin-reviews'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/reviews/admin`, {
                headers: { 'Authorization': `Bearer ${user?.token}` },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch reviews');
            return res.json();
        },
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        enabled: !!(user?.token),
    });

    const reviews = Array.isArray(reviewsData) 
        ? reviewsData 
        : (reviewsData?.reviews || reviewsData?.data || []);

    const approveReviewMutation = useMutation({
        mutationFn: async (id) => {
            const res = await fetch(`${API_BASE_URL}/api/reviews/admin/${id}/approve`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${user?.token}` },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to approve review');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            showToast('Review approved successfully', 'success');
        },
        onError: () => {
            showToast('Failed to approve review', 'error');
        }
    });

    const rejectReviewMutation = useMutation({
        mutationFn: async ({ id, reason }) => {
            const res = await fetch(`${API_BASE_URL}/api/reviews/admin/${id}/reject`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ reason })
            });
            if (!res.ok) throw new Error('Failed to reject review');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            showToast('Review rejected', 'success');
            setShowRejectModal(false);
            setSelectedReview(null);
            setRejectReason('');
        },
        onError: () => {
            showToast('Failed to reject review', 'error');
        },
        onSettled: () => {
            setRejecting(false);
        }
    });

    const replyReviewMutation = useMutation({
        mutationFn: async ({ id, reply }) => {
            const res = await fetch(`${API_BASE_URL}/api/reviews/admin/${id}/reply`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ reply })
            });
            if (!res.ok) throw new Error('Failed to save reply');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            showToast('Admin reply saved', 'success');
            setShowReplyModal(false);
            setSelectedReview(null);
            setReplyText('');
        },
        onError: () => {
            showToast('Failed to save reply', 'error');
        },
        onSettled: () => {
            setReplying(false);
        }
    });

    const deleteReviewMutation = useMutation({
        mutationFn: async (id) => {
            const res = await fetch(`${API_BASE_URL}/api/reviews/admin/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to delete review');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            showToast('Review deleted successfully', 'success');
        },
        onError: () => {
            showToast('Failed to delete review', 'error');
        }
    });
    const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected

    // Modal states
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    const handleApprove = async (id) => {
        approveReviewMutation.mutate(id);
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!user?.token || !selectedReview) return;
        setRejecting(true);
        rejectReviewMutation.mutate({ id: selectedReview._id, reason: rejectReason });
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!user?.token || !selectedReview) return;
        setReplying(true);
        replyReviewMutation.mutate({ id: selectedReview._id, reply: replyText });
    };

    const handleDelete = async (id) => {
        if (!user?.token) return;
        if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
        deleteReviewMutation.mutate(id);
    };

    // Filter reviews according to active tab
    const filteredReviews = reviews.filter(r => {
        if (activeTab === 'pending') return !r.isApproved && !r.isRejected;
        if (activeTab === 'approved') return r.isApproved;
        if (activeTab === 'rejected') return r.isRejected;
        return true;
    });

    const getProductImage = (productId) => {
        if (!productId?.images || productId.images.length === 0) return '/images/sample.jpg';
        const img = productId.images[0];
        if (img.startsWith('http') || img.startsWith('/images/')) return img;
        return `${API_BASE_URL}/uploads/${img.split('/').pop()}`;
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--surface-border)] pb-6">
                <div>
                    <h2 className="text-[10px] font-black tracking-[0.6em] uppercase opacity-35 mb-2">REVIEWS ENGINE</h2>
                    <h1 className="text-3xl font-serif font-black tracking-tight uppercase">REVIEWS MANAGEMENT</h1>
                </div>

                {/* Star statistics summary */}
                <div className="flex items-center gap-4 bg-[var(--surface-color)] p-4 border border-[var(--surface-border)] shrink-0">
                    <div className="text-center px-4 border-r border-[var(--surface-border)]">
                        <p className="text-2xl font-serif font-black">{reviews.length}</p>
                        <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] mt-1">Total</p>
                    </div>
                    <div className="text-center px-4 border-r border-[var(--surface-border)] text-orange-500">
                        <p className="text-2xl font-serif font-black">
                            {reviews.filter(r => !r.isApproved && !r.isRejected).length}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider mt-1">Pending</p>
                    </div>
                    <div className="text-center px-4 text-emerald-500">
                        <p className="text-2xl font-serif font-black">
                            {reviews.filter(r => r.isApproved).length}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider mt-1">Approved</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[var(--surface-border)] gap-6">
                {[
                    { id: 'pending', label: 'Pending Approval', count: reviews.filter(r => !r.isApproved && !r.isRejected).length },
                    { id: 'approved', label: 'Approved Reviews', count: reviews.filter(r => r.isApproved).length },
                    { id: 'rejected', label: 'Rejected Reviews', count: reviews.filter(r => r.isRejected).length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${
                            activeTab === tab.id 
                                ? 'text-[var(--color-primary)] font-bold' 
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {tab.label} ({tab.count})
                        {activeTab === tab.id && (
                            <motion.div 
                                layoutId="adminTabIndicator" 
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Reviews list container */}
            {loading ? (
                <AdminTableSkeleton rows={4} cols={4} />
            ) : filteredReviews.length === 0 ? (
                <div className="min-h-[300px] border border-[var(--surface-border)] flex flex-col items-center justify-center p-8 bg-[var(--bg-color)]">
                    <MessageSquare size={36} className="text-[var(--text-muted)] mb-4 opacity-50" />
                    <p className="text-xs font-black tracking-widest uppercase text-[var(--text-muted)]">No reviews found in this tab.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredReviews.map((review) => (
                        <div 
                            key={review._id} 
                            className="bg-[var(--bg-color)] border border-[var(--surface-border)] p-6 md:p-8 flex flex-col lg:flex-row gap-6 justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                            {/* Review content details */}
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    {/* Star Rating display */}
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                size={14} 
                                                className={i < review.rating ? "fill-orange-500 text-orange-500" : "text-gray-300"} 
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
                                        {review.userName}
                                    </span>
                                    <span className="text-[9px] text-[var(--text-muted)]">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                    {review.verifiedPurchase && (
                                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                                            <ShieldCheck size={10} /> Verified Buy
                                        </span>
                                    )}
                                    {review.isRejected && (
                                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                                            <ShieldAlert size={10} /> Rejected
                                        </span>
                                    )}
                                </div>

                                {/* Main Text comment */}
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed font-sans pr-4">
                                    {review.comment}
                                </p>

                                {/* Image thumbnails */}
                                {review.reviewImages && review.reviewImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {review.reviewImages.map((imgUrl, i) => (
                                            <a 
                                                key={i} 
                                                href={imgUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="w-16 h-16 border border-[var(--surface-border)] overflow-hidden shrink-0 hover:scale-105 transition-transform"
                                            >
                                                <img 
                                                    src={imgUrl} 
                                                    alt="Review user upload" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Admin Rejection reason */}
                                {review.isRejected && review.rejectionReason && (
                                    <div className="bg-red-500/5 border-l-2 border-red-500 p-3 mt-3">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Rejection Reason</p>
                                        <p className="text-xs font-sans text-red-500/80 mt-1">{review.rejectionReason}</p>
                                    </div>
                                )}

                                {/* Indented Admin reply bubble */}
                                {review.adminReply && (
                                    <div className="bg-[var(--surface-color)] border border-[var(--surface-border)] p-4 ml-4 md:ml-8 relative mt-4">
                                        <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-primary)]">EYESTYLE Team Reply</span>
                                            </div>
                                            {review.adminReplyAt && (
                                                <span className="text-[8px] text-[var(--text-muted)]">
                                                    {new Date(review.adminReplyAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                                            {review.adminReply}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Product linked reference (Right block) */}
                            <div className="flex lg:flex-col justify-between items-start lg:items-end lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--surface-border)] pt-4 lg:pt-0 lg:pl-6 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white border border-[var(--surface-border)] overflow-hidden shrink-0">
                                        <img 
                                            src={getProductImage(review.productId)} 
                                            alt={review.productId?.name || 'Product'} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Product</p>
                                        <p className="text-xs font-serif font-black uppercase tracking-tight line-clamp-1">
                                            {review.productId?.name || 'Unknown Product'}
                                        </p>
                                    </div>
                                </div>

                                {/* Admin Action buttons */}
                                <div className="flex flex-wrap items-center justify-end gap-2 w-full pt-2 lg:pt-4 border-t lg:border-t-0 border-[var(--surface-border)]/5">
                                    {/* Approve button (shows only on pending or rejected) */}
                                    {!review.isApproved && (
                                        <button 
                                            onClick={() => handleApprove(review._id)}
                                            className="h-9 px-3 flex items-center justify-center bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-[9px] font-black uppercase tracking-widest gap-1.5"
                                            title="Approve Review"
                                        >
                                            <Check size={12} /> Approve
                                        </button>
                                    )}

                                    {/* Reject button (shows on pending or approved) */}
                                    {!review.isRejected && (
                                        <button 
                                            onClick={() => { setSelectedReview(review); setRejectReason(review.rejectionReason || ''); setShowRejectModal(true); }}
                                            className="h-9 px-3 flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600 transition-colors text-[9px] font-black uppercase tracking-widest gap-1.5"
                                            title="Reject Review"
                                        >
                                            <X size={12} /> Reject
                                        </button>
                                    )}

                                    {/* Reply button */}
                                    <button 
                                        onClick={() => { setSelectedReview(review); setReplyText(review.adminReply || ''); setShowReplyModal(true); }}
                                        className="h-9 px-3 flex items-center justify-center bg-transparent text-[var(--text-primary)] border border-[var(--surface-border)] hover:bg-[var(--surface-color)] transition-all text-[9px] font-black uppercase tracking-widest gap-1.5"
                                        title="Add/Edit Admin Reply"
                                    >
                                        <MessageCircle size={12} /> Reply
                                    </button>

                                    {/* Delete button */}
                                    <button 
                                        onClick={() => handleDelete(review._id)}
                                        className="h-9 w-9 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                        title="Delete Review permanently"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reply Modal */}
            <AnimatePresence>
                {showReplyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[var(--bg-color)] border border-[var(--surface-border)] p-6 md:p-8 max-w-md w-full shadow-2xl rounded-none"
                        >
                            <h3 className="text-sm font-serif font-black uppercase tracking-widest mb-4">Add Admin Response</h3>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-6">
                                Replying to {selectedReview?.userName}'s review on {selectedReview?.productId?.name}
                            </p>
                            <form onSubmit={handleReplySubmit} className="space-y-4">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write your professional response to the customer..."
                                    rows="4"
                                    className="w-full border border-[var(--surface-border)] bg-[var(--surface-color)] text-[var(--text-primary)] p-3 text-xs outline-none focus:border-[var(--color-primary)] transition-all resize-none"
                                    required
                                ></textarea>
                                <div className="flex gap-3 justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowReplyModal(false); setSelectedReview(null); }}
                                        className="h-10 px-4 text-[9px] font-black uppercase tracking-widest border border-[var(--surface-border)] hover:bg-[var(--surface-color)]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={replying}
                                        className="h-10 px-6 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                                    >
                                        {replying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Reply'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rejection Reason Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[var(--bg-color)] border border-[var(--surface-border)] p-6 md:p-8 max-w-md w-full shadow-2xl rounded-none"
                        >
                            <h3 className="text-sm font-serif font-black uppercase tracking-widest mb-4">Reject Review</h3>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-6">
                                Rejecting {selectedReview?.userName}'s review. Please specify a guideline violation.
                            </p>
                            <form onSubmit={handleRejectSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. Inappropriate language, unrelated advertisement..."
                                    className="w-full border border-[var(--surface-border)] bg-[var(--surface-color)] text-[var(--text-primary)] p-3 text-xs outline-none focus:border-[var(--color-primary)] transition-all"
                                    required
                                />
                                <div className="flex gap-3 justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowRejectModal(false); setSelectedReview(null); }}
                                        className="h-10 px-4 text-[9px] font-black uppercase tracking-widest border border-[var(--surface-border)] hover:bg-[var(--surface-color)]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={rejecting}
                                        className="h-10 px-6 bg-orange-500 text-white hover:bg-orange-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                                    >
                                        {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Reject'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReviewsList;
