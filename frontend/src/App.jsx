import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import Dashboard from './components/Dashboard';

function Navbar() {
  return (
    <nav className="bg-white shadow-lg rounded-b-2xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            <Link to="/" className="text-purple-600 font-bold text-xl hover:text-purple-800 transition">🏠 Dashboard</Link>
            <Link to="/products" className="text-gray-700 hover:text-purple-600 transition">📦 Products</Link>
            <Link to="/products/new" className="text-gray-700 hover:text-purple-600 transition">➕ Add Product</Link>
            <Link to="/users" className="text-gray-700 hover:text-purple-600 transition">👥 Users</Link>
            <Link to="/users/new" className="text-gray-700 hover:text-purple-600 transition">👤 Add User</Link>
          </div>
          <div className="text-purple-500 font-semibold">✨ 3-Tier App</div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/edit/:id" element={<ProductForm />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/users/new" element={<UserForm />} />
            <Route path="/users/edit/:id" element={<UserForm />} />
          </Routes>
        </div>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;