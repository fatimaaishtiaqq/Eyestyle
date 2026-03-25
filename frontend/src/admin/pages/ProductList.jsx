import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Search, Plus, Filter, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../utils/apiClient';

const resolveImageUrl = (img) => {
    if (!img || typeof img !== 'string') return '/images/sample.jpg';
    if (img.startsWith('http') || img.startsWith('https') || img.startsWith('/images/')) return img;
    return img;
};

const ProductList = () => {
    const { showToast } = useToast();
    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtering State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Custom value toggle for Frame Shape / Lens Type dropdowns
    const [isCustomFrameShape, setIsCustomFrameShape] = useState(false);
    const [isCustomLensType, setIsCustomLensType] = useState(false);

    const initialFormState = {
        name: '',
        price: '',
        category: '',
        subcategory: '',
        countInStock: '',
        description: '',
        images: [],
        brand: 'Eyestyle',
        frameShape: '',
        lensType: '',
        variations: [],
        details: []
    };
    const [formData, setFormData] = useState(initialFormState);

    const fetchData = async () => {
        if (!user?.token) return;
        try {
            const [prodRes, catRes, subRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/products/admin`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
                fetch(`${API_BASE_URL}/api/categories/admin`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
                fetch(`${API_BASE_URL}/api/subcategories/admin`, { headers: { 'Authorization': `Bearer ${user.token}` } })
            ]);

            if (prodRes.ok && catRes.ok) {
                const prodData = await prodRes.json();
                const catData = await catRes.json();
                setProducts(prodData || []);
                setCategories(catData);
            }
            if (subRes.ok) {
                const subData = await subRes.json();
                setSubcategories(subData || []);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to fetch data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchData();
    }, [user?.token]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleCreateOrUpdateProduct = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price || !formData.category || !formData.countInStock) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        setSubmitting(true);
        const url = isEditMode ? `${API_BASE_URL}/api/products/${editingProductId}` : `${API_BASE_URL}/api/products`;
        const method = isEditMode ? 'PUT' : 'POST';

        const bodyData = {
            name: formData.name,
            price: Number(formData.price),
            category: formData.category,
            countInStock: Number(formData.countInStock),
            description: formData.description,
            images: formData.images,
            brand: formData.brand,
            frameShape: formData.frameShape,
            lensType: formData.lensType,
            variations: formData.variations,
            details: formData.details
        };

        if (formData.subcategory) {
            bodyData.subcategory = formData.subcategory;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                showToast(`Product ${isEditMode ? 'updated' : 'created'} successfully`, 'success');
                setIsModalOpen(false);
                setFormData(initialFormState);
                fetchData();
            } else {
                const data = await res.json();
                showToast(data.message || `Failed to ${isEditMode ? 'update' : 'create'} product`, 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                showToast('Product deleted', 'success');
                fetchData();
            } else {
                showToast('Failed to delete product', 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        }
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingProductId(null);
        setFormData(initialFormState);
        setIsCustomFrameShape(false);
        setIsCustomLensType(false);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setIsEditMode(true);
        setEditingProductId(product._id);
        const categoryId = product.category?._id || product.category || '';
        const subcategoryId = product.subcategory?._id || product.subcategory || '';
        const images = product.images || (product.image ? [product.image] : []);
        const variations = (product.variations || []).map(v => {
            const includeImages = Boolean(v && v.includeImages);
            const options = Array.isArray(v.options) ? v.options.map(opt => {
                if (typeof opt === 'string') return { value: opt, image: null };
                return { value: (opt && opt.value) ? String(opt.value) : '', image: (opt && opt.image) ? String(opt.image) : null };
            }) : [];
            return { name: (v && v.name) ? String(v.name) : '', includeImages, options };
        });
        setFormData({
            name: product.name,
            price: product.price,
            category: categoryId,
            subcategory: subcategoryId,
            countInStock: product.countInStock,
            description: product.description,
            images,
            brand: product.brand,
            frameShape: product.frameShape || '',
            lensType: product.lensType || '',
            variations,
            details: product.details || []
        });
        setIsCustomFrameShape(false);
        setIsCustomLensType(false);
        setIsModalOpen(true);
    };

    const uploadFileHandler = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const uploadData = new FormData();
        for (let i = 0; i < files.length; i++) {
            uploadData.append('images', files[i]);
        }

        try {
            setSubmitting(true);
            const res = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                },
                body: uploadData,
            });

            if (res.ok) {
                const data = await res.json();
                setFormData({ ...formData, images: [...formData.images, ...data.images] });
                showToast('Images uploaded', 'success');
            } else {
                showToast('Upload failed', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Upload error', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const removeImage = (indexToRemove) => {
        setFormData({
            ...formData,
            images: formData.images.filter((_, i) => i !== indexToRemove)
        });
    };

    // Array field handlers (details)
    const handleAddArrayItem = (field) => {
        setFormData({ ...formData, [field]: [...formData[field], ''] });
    };

    const handleArrayItemChange = (field, index, value) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const handleRemoveArrayItem = (field, index) => {
        setFormData({
            ...formData,
            [field]: formData[field].filter((_, i) => i !== index)
        });
    };

    // Complex Variation Handlers
    const handleAddVariation = () => {
        setFormData({
            ...formData,
            variations: [...formData.variations, { name: '', includeImages: false, options: [{ value: '', image: null }] }]
        });
    };

    const handleRemoveVariation = (index) => {
        setFormData({
            ...formData,
            variations: formData.variations.filter((_, i) => i !== index)
        });
    };

    const handleVariationNameChange = (index, value) => {
        const newVars = [...formData.variations];
        newVars[index] = { ...newVars[index], name: value };
        setFormData({ ...formData, variations: newVars });
    };

    const handleVariationIncludeImagesChange = (varIndex, checked) => {
        const newVars = [...formData.variations];
        newVars[varIndex] = { ...newVars[varIndex], includeImages: checked };
        if (!checked) {
            newVars[varIndex].options = newVars[varIndex].options.map(o => ({ ...o, image: null }));
        }
        setFormData({ ...formData, variations: newVars });
    };

    const handleAddVariationOption = (varIndex) => {
        const newVars = [...formData.variations];
        const opt = { value: '', image: null };
        newVars[varIndex].options = [...(newVars[varIndex].options || []), opt];
        setFormData({ ...formData, variations: newVars });
    };

    const handleRemoveVariationOption = (varIndex, optIndex) => {
        const newVars = [...formData.variations];
        newVars[varIndex].options = newVars[varIndex].options.filter((_, i) => i !== optIndex);
        setFormData({ ...formData, variations: newVars });
    };

    const handleVariationOptionChange = (varIndex, optIndex, value) => {
        const newVars = [...formData.variations];
        const opts = [...(newVars[varIndex].options || [])];
        opts[optIndex] = { ...opts[optIndex], value };
        newVars[varIndex] = { ...newVars[varIndex], options: opts };
        setFormData({ ...formData, variations: newVars });
    };

    const handleVariationOptionImageChange = (varIndex, optIndex, image) => {
        const newVars = [...formData.variations];
        const opts = [...(newVars[varIndex].options || [])];
        opts[optIndex] = { ...opts[optIndex], image: image || null };
        newVars[varIndex] = { ...newVars[varIndex], options: opts };
        setFormData({ ...formData, variations: newVars });
    };

    // Images already assigned to other options in this variation (excluding option at excludeOptIndex). Used to disable duplicate selection.
    const getUsedImagesInVariation = (varIndex, excludeOptIndex) => {
        const v = formData.variations[varIndex];
        if (!v || !Array.isArray(v.options)) return new Set();
        const used = new Set();
        v.options.forEach((opt, i) => {
            if (i !== excludeOptIndex && opt.image && opt.image.trim()) used.add(opt.image.trim());
        });
        return used;
    };

    // Categories are top-level; subcategories filtered by selected category (ObjectId)
    // We support both dedicated SubCategory docs and child Category rows (parent = major category).
    const subCategoriesFiltered = formData.category
        ? (() => {
            const selectedId = formData.category.toString();
            const fromSubcollections = subcategories.filter(s => ((s.category && (s.category._id || s.category)) || '').toString() === selectedId);
            const fromChildCategories = categories.filter(c => ((c.parent && (c.parent._id || c.parent)) || '').toString() === selectedId);
            const merged = [...fromSubcollections, ...fromChildCategories];
            const seen = new Set();
            return merged.filter(item => {
                const id = (item._id || item).toString();
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });
        })()
        : [];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory ? (p.category === filterCategory || p.subcategory === filterCategory) : true;
        return matchesSearch && matchesCategory;
    });

    // Dynamic Lists for Select Dropdowns
    const defaultFrameShapes = ['Aviator', 'Round', 'Square', 'Rectangle', 'Cat Eye', 'Oversized', 'Wayfarer', 'Geometric', 'Shield', 'Butterfly'];
    const dbFrameShapes = [...new Set(products.map(p => p.frameShape).filter(Boolean))];
    const allFrameShapes = [...new Set([...defaultFrameShapes, ...dbFrameShapes])].sort();

    const defaultLensTypes = ['Polarized', 'UV Protection', 'Gradient', 'Mirrored', 'Standard', 'Photochromic', 'Anti-Reflective', 'Blue Light Blocking', 'Tinted'];
    const dbLensTypes = [...new Set(products.map(p => p.lensType).filter(Boolean))];
    const allLensTypes = [...new Set([...defaultLensTypes, ...dbLensTypes])].sort();


    return (
        <div className="w-full pb-20 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">Products</h1>
                    <p className="text-[var(--text-primary)] text-sm mt-1">Manage your entire product inventory.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn-primary text-[var(--bg-color)] px-5 py-2 flex items-center gap-2 uppercase tracking-widest text-xs font-bold hover:bg-black transition-colors"
                >
                    <Plus size={16} /> Add Product
                </button>
            </div>

            {/* List */}
            <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] rounded-none">
                <div className="p-4 border-b border-[var(--surface-border)] flex justify-between items-center gap-4 flex-wrap">
                    <div className="flex items-center bg-[var(--surface-color)] px-3 py-2 border border-[var(--surface-border)] w-full max-w-md">
                        <Search size={14} className="text-[var(--text-primary)] mr-2" />
                        <input
                            type="text"
                            name="searchProducts"
                            id="searchProducts"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-[var(--text-primary)]" />
                        <select
                            name="filterCategory"
                            id="filterCategory"
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="bg-[var(--surface-color)] border border-[var(--surface-border)] px-3 py-2 text-xs outline-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[var(--surface-color)] text-xs uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--surface-border)]">
                            <tr>
                                <th className="px-4 py-4">ID</th>
                                <th className="px-4 py-4">Name</th>
                                <th className="px-4 py-4">Category</th>
                                <th className="px-4 py-4">Subcategory</th>
                                <th className="px-4 py-4 text-right">Price</th>
                                <th className="px-4 py-4 text-right">Inventory</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-border)]">
                            {loading ? (
                                <tr><td colSpan="8" className="px-4 py-8 text-center text-[var(--text-primary)] italic">Evaluating Inventory...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="8" className="px-4 py-8 text-center text-[var(--text-primary)] italic">No products found.</td></tr>
                            ) : filteredProducts.map((product) => {
                                const catId = product.category?._id || product.category;
                                const subId = product.subcategory?._id || product.subcategory;
                                const catName = categories.find(c => (c._id || c).toString() === (catId || '').toString())?.name || 'Unknown';
                                const subCatObj = subcategories.find(s => (s._id || s).toString() === (subId || '').toString()) || categories.find(c => (c._id || c).toString() === (subId || '').toString());
                                const subCatName = subCatObj?.name || '';

                                return (
                                    <tr key={product._id} className="hover:bg-surface">
                                        <td className="px-4 py-4 text-[var(--text-primary)] text-xs">{product._id.substring(18).toUpperCase()}</td>
                                        <td className="px-4 py-4 font-medium text-[var(--text-primary)] max-w-[200px] truncate" title={product.name}>
                                            <div className="flex items-center gap-3">
                                                {product.images && product.images.length > 0 && <img src={resolveImageUrl(product.images[0])} className="w-8 h-8 object-cover rounded-none" alt="img" />}
                                                <span className="truncate">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-[var(--text-primary)] text-xs">{catName}</td>
                                        <td className="px-4 py-4 text-[var(--text-primary)] text-xs">{subCatName}</td>
                                        <td className="px-4 py-4 text-right">${product.price.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right">{product.countInStock}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${product.countInStock > 10 ? 'bg-[var(--surface-color)] text-[var(--text-primary)]' :
                                                product.countInStock > 0 ? 'bg-[var(--surface-color)] text-[var(--text-primary)]' : 'bg-[var(--surface-color)] text-[var(--text-primary)]'
                                                }`}>
                                                {product.countInStock > 10 ? 'Active' : product.countInStock > 0 ? 'Low Stock' : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right flex justify-end gap-3">
                                            <button onClick={() => openEditModal(product)} className="text-[var(--text-primary)] hover:text-[var(--text-primary)]"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(product._id)} className="text-[var(--text-primary)] hover:text-[var(--text-primary)]"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-color)] border border-[var(--surface-border)] w-full max-w-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto rounded-none">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--text-primary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-serif font-bold tracking-widest uppercase mb-6 text-[var(--text-primary)]">
                            {isEditMode ? 'Edit Product' : 'New Product'}
                        </h2>

                        <form onSubmit={handleCreateOrUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Product Name *</label>
                                <input
                                    type="text" name="name" value={formData.name} onChange={handleChange} required
                                    className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Price ($) *</label>
                                <input
                                    type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required
                                    className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Stock Count *</label>
                                <input
                                    type="number" name="countInStock" value={formData.countInStock} onChange={handleChange} required
                                    className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Category *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={(e) => { handleChange(e); setFormData(prev => ({ ...prev, subcategory: '' })); }}
                                    required
                                    className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)] cursor-pointer bg-[var(--card-bg)]"
                                >
                                    <option value="" disabled>Select category</option>
                                    {categories.filter(c => !c.parent).map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                    {categories.filter(c => !c.parent).length === 0 && categories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Subcategory</label>
                                <select
                                    name="subcategory"
                                    value={formData.subcategory}
                                    onChange={handleChange}
                                    className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)] cursor-pointer bg-[var(--card-bg)]"
                                    disabled={!formData.category}
                                >
                                    <option value="">None</option>
                                    {subCategoriesFiltered.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Frame Shape Input */}
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Frame Shape *</label>
                                {!isCustomFrameShape ? (
                                    <div className="flex gap-2">
                                        <select
                                            name="frameShape"
                                            value={formData.frameShape}
                                            onChange={(e) => {
                                                if (e.target.value === 'ADD_CUSTOM') {
                                                    setIsCustomFrameShape(true);
                                                    setFormData({ ...formData, frameShape: '' });
                                                } else {
                                                    handleChange(e);
                                                }
                                            }}
                                            required
                                            className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)] cursor-pointer bg-[var(--card-bg)]"
                                        >
                                            <option value="" disabled>Select frame shape</option>
                                            {allFrameShapes.map(f => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                            <option value="ADD_CUSTOM" className="font-bold text-accent">+ Add New Custom Shape</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="frameShape"
                                            value={formData.frameShape}
                                            onChange={handleChange}
                                            placeholder="Enter new shape (e.g. Hexagonal)"
                                            required
                                            autoFocus
                                            className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)]"
                                        />
                                        <button type="button" onClick={() => setIsCustomFrameShape(false)} className="px-4 border border-[var(--surface-border)] bg-[var(--surface-color)] text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Lens Type Input */}
                            <div>
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Lens Type *</label>
                                {!isCustomLensType ? (
                                    <div className="flex gap-2">
                                        <select
                                            name="lensType"
                                            value={formData.lensType}
                                            onChange={(e) => {
                                                if (e.target.value === 'ADD_CUSTOM') {
                                                    setIsCustomLensType(true);
                                                    setFormData({ ...formData, lensType: '' });
                                                } else {
                                                    handleChange(e);
                                                }
                                            }}
                                            required
                                            className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)] cursor-pointer bg-[var(--card-bg)]"
                                        >
                                            <option value="" disabled>Select lens type</option>
                                            {allLensTypes.map(l => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                            <option value="ADD_CUSTOM" className="font-bold text-accent">+ Add New Custom Lens</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="lensType"
                                            value={formData.lensType}
                                            onChange={handleChange}
                                            placeholder="Enter new lens (e.g. Amber Tint)"
                                            required
                                            autoFocus
                                            className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)]"
                                        />
                                        <button type="button" onClick={() => setIsCustomLensType(false)} className="px-4 border border-[var(--surface-border)] bg-[var(--surface-color)] text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Images/Videos (Upload multiple files)</label>
                                <input
                                    type="file" multiple accept="image/*,video/*" onChange={uploadFileHandler}
                                    className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)] file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-[var(--surface-color)] file:text-[var(--text-primary)] hover:file:bg-surface"
                                />
                                {formData.images.length > 0 && (
                                    <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} className="relative w-20 h-20 flex-shrink-0 group">
                                                <img src={resolveImageUrl(img)} className="w-full h-full object-cover rounded-none border border-[var(--surface-border)]" alt={`Preview ${idx}`} />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute -top-2 -right-2 bg-[var(--surface-color)] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Variations Array */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Product Variations</label>
                                <p className="text-xs text-[var(--text-primary)] mb-4">Add product variations (e.g., Color, Size) and their available options. Optionally attach images from the product gallery to each option.</p>

                                {formData.variations.map((variation, vIndex) => {
                                    const options = variation.options || [];
                                    return (
                                        <div key={vIndex} className="bg-[var(--surface-color)] p-4 border border-[var(--surface-border)] rounded-sm mb-4 relative">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVariation(vIndex)}
                                                className="absolute top-4 right-4 text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <div className="mb-3 pr-8">
                                                <input
                                                    type="text"
                                                    name={`variationName-${vIndex}`}
                                                    value={variation.name}
                                                    onChange={(e) => handleVariationNameChange(vIndex, e.target.value)}
                                                    placeholder="Variation Name (e.g., Color)"
                                                    className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)] font-medium"
                                                    required
                                                />
                                            </div>

                                            <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name={`variationIncludeImages-${vIndex}`}
                                                    checked={Boolean(variation.includeImages)}
                                                    onChange={(e) => handleVariationIncludeImagesChange(vIndex, e.target.checked)}
                                                    className="w-4 h-4 accent-[var(--color-electric-blue)]"
                                                />
                                                <span className="text-xs font-medium text-[var(--text-primary)]">Include images for this variation?</span>
                                            </label>

                                            {variation.includeImages && formData.images.length === 0 && (
                                                <p className="text-[10px] text-amber-600 mb-2">Upload product images above first, then assign them to options.</p>
                                            )}

                                            <div className="pl-4 border-l-2 border-[var(--surface-border)]">
                                                <p className="text-[10px] uppercase font-bold text-[var(--text-primary)] tracking-widest mb-2">Options</p>
                                                {options.map((option, oIndex) => (
                                                    <div key={oIndex} className="flex flex-wrap items-center gap-2 mb-3">
                                                        <input
                                                            type="text"
                                                            name={`variationOption-${vIndex}-${oIndex}`}
                                                            value={option.value}
                                                            onChange={(e) => handleVariationOptionChange(vIndex, oIndex, e.target.value)}
                                                            placeholder={`Option ${oIndex + 1} (e.g., Red)`}
                                                            className="flex-1 min-w-[120px] border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)]"
                                                            required
                                                        />
                                                        {variation.includeImages && formData.images.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-[var(--text-primary)]">Image:</span>
                                                                <select
                                                                    name={`variationOptionImage-${vIndex}-${oIndex}`}
                                                                    value={option.image || ''}
                                                                    onChange={(e) => handleVariationOptionImageChange(vIndex, oIndex, e.target.value || null)}
                                                                    className="border border-[var(--surface-border)] px-2 py-1 text-xs bg-[var(--card-bg)] outline-none focus:border-[var(--color-electric-blue)] max-w-[140px]"
                                                                >
                                                                    <option value="">No image</option>
                                                                    {formData.images.map((img, imgIdx) => {
                                                                        const imgStr = typeof img === 'string' ? img : '';
                                                                        const usedByOther = getUsedImagesInVariation(vIndex, oIndex).has(imgStr);
                                                                        return (
                                                                            <option key={imgIdx} value={imgStr} disabled={usedByOther}>
                                                                                {usedByOther ? `Used (${imgIdx + 1})` : `Image ${imgIdx + 1}`}
                                                                            </option>
                                                                        );
                                                                    })}
                                                                </select>
                                                                {option.image && (
                                                                    <img src={resolveImageUrl(option.image)} alt="" className="w-10 h-10 object-cover border border-[var(--surface-border)] rounded-none" />
                                                                )}
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveVariationOption(vIndex, oIndex)}
                                                            className="p-2 border border-[var(--surface-border)] text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddVariationOption(vIndex)}
                                                    className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-primary)] hover:text-[var(--text-primary)] mt-1"
                                                >
                                                    + Add Option
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={handleAddVariation}
                                    className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 border border-[var(--text-primary)] hover:border-[var(--surface-border)] px-4 py-2 rounded-sm mt-2"
                                >
                                    <Plus size={14} /> Add Variation Group
                                </button>
                            </div>

                            {/* Dynamic Details & Care Array */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Details & Care Bullets</label>
                                {formData.details.map((detail, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            name={`detail-${idx}`}
                                            value={detail}
                                            onChange={(e) => handleArrayItemChange('details', idx, e.target.value)}
                                            placeholder="e.g. 100% UV Protection, Acetate Frame"
                                            className="flex-1 border border-[var(--surface-border)] px-4 py-2 text-sm outline-none focus:border-[var(--color-electric-blue)]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveArrayItem('details', idx)}
                                            className="px-3 bg-[var(--surface-color)] text-[var(--text-primary)] hover:bg-[var(--surface-color)] hover:text-white transition-colors border border-[var(--text-primary)]"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => handleAddArrayItem('details')}
                                    className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center gap-1 mt-2"
                                >
                                    <Plus size={14} /> Add Detail Bullet
                                </button>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Description</label>
                                <textarea
                                    name="description" value={formData.description} onChange={handleChange}
                                    className="w-full border border-[var(--surface-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-electric-blue)] min-h-[100px]"
                                />
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <button
                                    type="submit" disabled={submitting}
                                    className={`w-full btn-primary text-[var(--bg-color)] py-4 uppercase tracking-widest text-xs font-bold hover:bg-black transition-colors ${submitting ? 'opacity-70' : ''}`}
                                >
                                    {submitting ? 'Processing...' : (isEditMode ? 'Update Product' : 'Save Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
