import React, { useEffect, useState } from 'react';
import { fetchUsers, deleteUser } from '../api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function UserList() {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const res = await fetchUsers();
    setUsers(res.data);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete user?')) {
      await deleteUser(id);
      toast.success('User deleted');
      loadUsers();
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map(user => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
              <td className="px-6 py-4 whitespace-nowrap font-medium">{user.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap space-x-2">
                <Link to={`/users/edit/${user.id}`} className="text-blue-600 hover:text-blue-800">✏️ Edit</Link>
                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 ml-2">🗑️ Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}