import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUsers, createUser, updateUser } from '../api';
import toast from 'react-hot-toast';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    if (id) {
      fetchUsers().then(res => {
        const user = res.data.find(u => u.id == id);
        if (user) setForm(user);
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await updateUser(id, form);
        toast.success('User updated');
      } else {
        await createUser(form);
        toast.success('User created');
      }
      navigate('/users');
    } catch (err) {
      toast.error('Failed to save user');
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-purple-600 mb-6">{id ? 'Edit User' : 'Add New User'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Full Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full p-3 border rounded-xl" required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full p-3 border rounded-xl" required />
        <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold">
          {id ? 'Update User' : 'Create User'}
        </button>
      </form>
    </div>
  );
}