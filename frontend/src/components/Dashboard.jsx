import React, { useEffect, useState } from 'react';
import { fetchProducts, fetchUsers } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, users: 0, totalStock: 0 });

  useEffect(() => {
    Promise.all([fetchProducts(), fetchUsers()]).then(([prodRes, userRes]) => {
      const products = prodRes.data;
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      setStats({
        products: products.length,
        users: userRes.data.length,
        totalStock,
      });
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition">
        <h3 className="text-2xl font-bold">📦 Products</h3>
        <p className="text-5xl font-extrabold mt-4">{stats.products}</p>
      </div>
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition">
        <h3 className="text-2xl font-bold">👥 Users</h3>
        <p className="text-5xl font-extrabold mt-4">{stats.users}</p>
      </div>
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition">
        <h3 className="text-2xl font-bold">📊 Total Stock</h3>
        <p className="text-5xl font-extrabold mt-4">{stats.totalStock}</p>
      </div>
    </div>
  );
}