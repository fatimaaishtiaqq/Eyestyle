import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Search, Plus, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AdminTableSkeleton from '../../components/skeletons/AdminTableSkeleton';
import { API_BASE_URL } from '../../utils/apiClient';

const CategoryList = () => {
    const { showToast } = useToast();
    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Add Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [newCatParent, setNewCatParent] = useState('');
    const [newCatImage, setNewCatImage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCatName, setEditCatName] = useState('');
    const [editCatDesc, setEditCatDesc] = useState('');
    const [editCatParent, setEditCatParent] = useState('');
    const [editCatImage, setEditCatImage] = useState('');

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/categories/admin`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to fetch categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchCategories();
    }, [user?.token]);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) {
            showToast('Category name is required', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const bodyData = { name: newCatName, description: newCatDesc, image: newCatImage };
            if (newCatParent) bodyData.parent = newCatParent;

            const res = await fetch(`${API_BASE_URL}/api/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                showToast('Category created successfully', 'success');
                setIsModalOpen(false);
                setNewCatName('');
                setNewCatDesc('');
                setNewCatParent('');
                setNewCatImage('');
                fetchCategories();
            } else {
                const data = await res.json();
                showToast(data.message || 'Failed to create category', 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditCategory = async (e) => {
        e.preventDefault();
        if (!editCatName.trim()) {
            showToast('Category name is required', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const bodyData = { name: editCatName, description: editCatDesc, image: editCatImage };
            if (editCatParent) bodyData.parent = editCatParent;
            else bodyData.parent = null; // Remove parent if not selected

            const res = await fetch(`${API_BASE_URL}/api/categories/${editingCategory._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                showToast('Category updated successfully', 'success');
                setIsEditModalOpen(false);
                fetchCategories();
            } else {
                const data = await res.json();
                showToast(data.message || 'Failed to update category', 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (cat) => {
        setEditingCategory(cat);
        setEditCatName(cat.name);
        setEditCatDesc(cat.description || '');
        setEditCatParent(cat.parent?._id || '');
        setEditCatImage(cat.image || '');
        setIsEditModalOpen(true);
    };

    const uploadFileHandler = async (e, setImageFn) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('images', file);

        try {
            setSubmitting(true);
            const res = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}` },
                body: uploadData,
            });

            if (res.ok) {
                const data = await res.json();
                if (data.images && data.images.length > 0) {
                    setImageFn(data.images[0]);
                    showToast('Image uploaded', 'success');
                } else {
                    showToast('Upload failed - no image returned', 'error');
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                showToast(errData.message || `Upload failed (${res.status})`, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Upload error - ensure backend is running on port 5000', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const resolveImageUrl = (img) => {
        if (!img || typeof img !== 'string') return null;
        if (img.startsWith('http') || img.startsWith('https') || img.startsWith('/images/')) return img;
        return img;
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                showToast('Category deleted', 'success');
                fetchCategories();
            } else {
                showToast('Failed to delete category', 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        }
    };

    return (
        <div className="w-full pb-20 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">Categories</h1>
                    <p className="text-[var(--text-primary)] text-sm mt-1">Manage your product categorization structure.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary text-[var(--bg-color)] px-5 py-2 flex items-center gap-2 uppercase tracking-widest text-xs font-bold transition-colors"
                >
                    <Plus size={16} /> Add Category
                </button>
            </div>

            {/* List */}
            <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] rounded-none">
                <div className="p-4 border-b border-[var(--surface-border)] flex justify-between items-center">
                    <div className="flex items-center bg-[var(--surface-color)] px-3 py-2 border border-[var(--surface-border)] w-64">
                        <Search size={14} className="text-[var(--text-primary)] mr-2" />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search categories..." className="bg-transparent border-none outline-none text-xs w-full" />
                    </div>
                </div>
                {loading ? (
                    <AdminTableSkeleton rows={6} cols={6} />
                ) : (
                    <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--surface-color)] text-xs uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--surface-border)]">
                        <tr>
                            <th className="px-6 py-4">Image</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Slug</th>
                            <th className="px-6 py-4">Parent</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--surface-border)]">
                        {filteredCategories.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-[var(--text-primary)] italic">No categories found.</td></tr>
                        ) : filteredCategories.map((cat) => (
                            <tr key={cat._id} className="hover:bg-surface">
                                <td className="px-6 py-4">
                                    {cat.image ? (
                                        <img src={resolveImageUrl(cat.image)} className="w-10 h-10 object-cover rounded-none" alt={cat.name} />
                                    ) : (
                                        <div className="w-10 h-10 bg-[var(--surface-color)] rounded-none flex items-center justify-center text-[var(--text-primary)] text-xs">No Img</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{cat.name}</td>
                                <td className="px-6 py-4 text-[var(--text-primary)]">/{cat.slug}</td>
                                <td className="px-6 py-4 text-[var(--text-primary)]">{cat.parent ? cat.parent.name : '--'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-[var(--surface-color)] text-[var(--text-primary)]`}>
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-3">
                                    <button onClick={() => openEditModal(cat)} className="text-[var(--color-primary)] hover:brightness-150 transition-colors"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(cat._id)} className="text-[var(--color-primary)] hover:brightness-150 transition-colors"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>

            {/* Add Category Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-color)] border border-[var(--surface-border)] rounded-none w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--text-primary)] hover:text-[var(--text-primary)]"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-serif font-bold tracking-widest uppercase mb-6">New Category</h2>

                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Category Name *</label>
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Parent Category (Optional)</label>
                                <select
                                    value={newCatParent}
                                    onChange={(e) => setNewCatParent(e.target.value)}
                                    className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)] bg-[var(--card-bg)]"
                                >
                                    <option value="">-- None (Major Category) --</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Description (Optional)</label>
                                <textarea
                                    value={newCatDesc}
                                    onChange={(e) => setNewCatDesc(e.target.value)}
                                    className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)] min-h-[80px]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Category Image (Optional)</label>
                                <input
                                    type="file" accept="image/*" onChange={(e) => uploadFileHandler(e, setNewCatImage)}
                                    className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)] file:mr-4 file:py-1 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-[var(--surface-color)] file:text-[var(--text-primary)] hover:file:bg-surface"
                                />
                                {newCatImage && (
                                    <div className="mt-3 relative w-16 h-16 inline-block group">
                                        <img src={resolveImageUrl(newCatImage)} className="w-full h-full object-cover rounded-none border border-[var(--surface-border)]" alt="Preview" />
                                        <button type="button" onClick={() => setNewCatImage('')} className="absolute -top-2 -right-2 bg-[var(--surface-color)] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full btn-primary text-[var(--bg-color)] py-3 uppercase tracking-widest text-xs font-bold transition-colors mt-4 ${submitting ? 'opacity-70' : ''}`}
                            >
                                {submitting ? 'Creating...' : 'Create Category'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-color)] border border-[var(--surface-border)] rounded-none w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--text-primary)] hover:text-[var(--text-primary)]"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-serif font-bold tracking-widest uppercase mb-6">Edit Category</h2>

                        <form onSubmit={handleEditCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Category Name *</label>
                                <input
                                    type="text"
                                    value={editCatName}
                                    onChange={(e) => setEditCatName(e.target.value)}
                                    className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Parent Category (Optional)</label>
                                <select
                                    value={editCatParent}
                                    onChange={(e) => setEditCatParent(e.target.value)}
                                    className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)] bg-[var(--card-bg)]"
                                >
                                    <option value="">-- None (Major Category) --</option>
                                    {categories.filter(c => c._id !== editingCategory?._id).map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Description (Optional)</label>
                                <textarea
                                    value={editCatDesc}
                                    onChange={(e) => setEditCatDesc(e.target.value)}
                                    className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)] min-h-[80px]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Category Image (Optional)</label>
                                <input
                                    type="file" accept="image/*" onChange={(e) => uploadFileHandler(e, setEditCatImage)}
                                    className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)] file:mr-4 file:py-1 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-[var(--surface-color)] file:text-[var(--text-primary)] hover:file:bg-surface"
                                />
                                {editCatImage && (
                                    <div className="mt-3 relative w-16 h-16 inline-block group">
                                        <img src={resolveImageUrl(editCatImage)} className="w-full h-full object-cover rounded-none border border-[var(--surface-border)]" alt="Preview" />
                                        <button type="button" onClick={() => setEditCatImage('')} className="absolute -top-2 -right-2 bg-[var(--surface-color)] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full btn-primary text-[var(--bg-color)] py-3 uppercase tracking-widest text-xs font-bold transition-colors mt-4 ${submitting ? 'opacity-70' : ''}`}
                            >
                                {submitting ? 'Saving...' : 'Save Category'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryList;
