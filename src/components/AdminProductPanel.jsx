import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/products';
const ADMIN_SECRET_KEY = 'stern_admin_secret_123';

const AdminProductPanel = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    badge: 'New',
  });

  // Multiple Images State
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE_URL);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Open Modal
  const openModal = (product = null) => {
    setError('');
    setSuccess('');
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        badge: product.badge || 'New',
      });

      const existingImages = product.images && product.images.length > 0 
        ? product.images 
        : (product.image ? [product.image] : []);

      const formattedPreviews = existingImages.filter(Boolean).map(img => 
        img.startsWith('http') ? img : `http://localhost:5000${img}`
      );

      setImagePreviews(formattedPreviews);
      setImageFiles([]);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', badge: 'New' });
      setImagePreviews([]);
      setImageFiles([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Improved Image Change Handler
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Append new files to existing files array
    const updatedFiles = [...imageFiles, ...selectedFiles];
    setImageFiles(updatedFiles);

    // Create and append object URLs for new previews
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // Remove individual image from selection
  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('badge', formData.badge);

    // Append multiple files
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => {
        data.append('images', file);
      });
    } else if (!editingProduct) {
      setError('Please select at least one image file');
      return;
    }

    try {
      const url = editingProduct ? `${API_BASE_URL}/${editingProduct._id}` : API_BASE_URL;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'x-admin-key': ADMIN_SECRET_KEY,
        },
        body: data,
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || 'Operation failed');
      }

      setSuccess(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
      closeModal();
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      setError('');
      setSuccess('');
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': ADMIN_SECRET_KEY,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete product');
      }

      setSuccess('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-neutral-400 text-sm mt-1">Manage catalog items, pricing, and images.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add New Product
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Product Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-neutral-400">Loading catalog items...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">No products found. Click above to add one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/50 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="p-4">Product</th>
                    <th className="p-4">Badge</th>
                    <th className="p-4">Price</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {products.map((product) => {
                    const firstImage = (product.images && product.images.length > 0)
                      ? product.images[0]
                      : product.image;

                    const imageUrl = firstImage?.startsWith('http')
                      ? firstImage
                      : `http://localhost:5000${firstImage}`;

                    const totalImagesCount = product.images ? product.images.length : (product.image ? 1 : 0);

                    return (
                      <tr key={product._id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-14 h-14 rounded-lg object-cover bg-neutral-800 shrink-0 border border-neutral-700"
                              />
                              {totalImagesCount > 1 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                  +{totalImagesCount - 1}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{product.name}</div>
                              <div className="text-neutral-400 text-xs line-clamp-1 max-w-xs mt-0.5">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-block bg-neutral-800 text-amber-400 border border-amber-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
                            {product.badge || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-amber-400">{product.price}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(product)}
                              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Modal Dialog (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Stern Velvet Rose"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Price</label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., ₹2,499"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Badge</label>
                  <select
                    name="badge"
                    value={formData.badge}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="New">New</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Limited Edition">Limited Edition</option>
                    <option value="Popular">Popular</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="Fragrance notes, ingredients, etc."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                ></textarea>
              </div>

              {/* Multiple Image Input & Previews */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Product Images (Select Multiple)
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="block w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
                  />

                  {/* Previews Grid with Delete Option */}
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {imagePreviews.length > 0 ? (
                      imagePreviews.map((src, index) => (
                        <div key={index} className="relative group shrink-0">
                          <img
                            src={src}
                            alt={`Preview ${index}`}
                            className="w-16 h-16 rounded-xl object-cover bg-neutral-950 border border-amber-500/50"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-0.5 shadow transition-colors"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-neutral-800 pt-5 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2 rounded-xl text-sm transition-all shadow-md active:scale-95"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductPanel;