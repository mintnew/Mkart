import React, { useEffect, useState } from 'react';
import { fetchProducts, deleteProduct } from '../api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const res = await fetchProducts();
      setProducts(res.data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      await deleteProduct(id);
      toast.success('Product deleted');
      loadProducts();
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) return <div className="text-white text-center">Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((prod) => (
        <div key={prod.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition">
          <img src={prod.image_url} alt={prod.name} className="h-48 w-full object-cover" />
          <div className="p-5">
            <h3 className="text-xl font-bold text-gray-800">{prod.name}</h3>
            <p className="text-gray-600 mt-1">{prod.description}</p>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-2xl font-bold text-purple-600">${prod.price}</span>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">Stock: {prod.stock}</span>
            </div>
            <div className="mt-4 flex space-x-2">
              <Link to={`/products/edit/${prod.id}`} className="flex-1 text-center bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 transition">✏️ Edit</Link>
              <button onClick={() => handleDelete(prod.id)} className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition">🗑️ Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}