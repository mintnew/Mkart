import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProducts, createProduct, updateProduct } from '../api';
import toast from 'react-hot-toast';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', stock: '', image_url: '' });

  useEffect(() => {
    if (id) {
      fetchProducts().then(res => {
        const product = res.data.find(p => p.id == id);
        if (product) setForm(product);
      });
    }
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await updateProduct(id, form);
        toast.success('Product updated');
      } else {
        await createProduct(form);
        toast.success('Product created');
      }
      navigate('/products');
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-purple-600 mb-6">{id ? 'Edit Product' : 'Add New Product'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className="w-full p-3 border rounded-xl" required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className="w-full p-3 border rounded-xl" />
        <input name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={handleChange} className="w-full p-3 border rounded-xl" required />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} className="w-full p-3 border rounded-xl" />
        <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} className="w-full p-3 border rounded-xl" />
        <input name="image_url" placeholder="Image URL" value={form.image_url} onChange={handleChange} className="w-full p-3 border rounded-xl" />
        <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
          {id ? 'Update Product' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}