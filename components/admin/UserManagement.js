'use client';

import { useState, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus, 
  UserMinus,
  Save,
  X 
} from 'lucide-react';
import { useToast, ConfirmDialog } from '@/components/ui/Toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserModal, setNewUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    isAdmin: false
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const { addToast, ToastContainer } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token');
        }

        const response = await fetch('/api/admin/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch users');
        
        const data = await response.json();
        setUsers(data.users || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        addToast(error.message, 'error');
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleUserAction = async (userId, action, additionalData = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          action,
          userData: additionalData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform action');
      }

      const data = await response.json();

      // Handle different actions
      switch (action) {
        case 'create':
          setUsers([...users, data.user]);
          setNewUserModal(false);
          setNewUserData({ name: '', email: '', isAdmin: false });
          
          // Optional: Show temporary password to user
          if (data.tempPassword) {
            addToast(`Temporary password for ${data.user.email}: ${data.tempPassword}`, 'info', 5000);
          }
          
          addToast('User created successfully', 'success');
          break;
        
        case 'update':
          setUsers(users.map(user => 
            user._id === userId ? { ...user, ...data.user } : user
          ));
          setEditingUser(null);
          addToast('User updated successfully', 'success');
          break;
        
        case 'delete':
          setUsers(users.filter(user => user._id !== userId));
          setDeleteConfirmation(null);
          addToast('User deleted successfully', 'success');
          break;
        
        case 'makeAdmin':
          setUsers(users.map(user => 
            user._id === userId ? { ...user, isAdmin: true } : user
          ));
          addToast('User promoted to admin', 'success');
          break;
        
        case 'removeAdmin':
          setUsers(users.map(user => 
            user._id === userId ? { ...user, isAdmin: false } : user
          ));
          addToast('Admin privileges removed', 'warning');
          break;
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      addToast(error.message, 'error');
    }
  };

  const handleDeleteUser = (user) => {
    setDeleteConfirmation({
      userId: user._id,
      userName: user.name
    });
  };

  const handleEditUser = (user) => {
    setEditingUser({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });
  };

  const renderUserRow = (user) => {
    if (editingUser && editingUser._id === user._id) {
      return (
        <tr key={user._id} className="bg-gray-100 dark:bg-gray-800">
          <td className="px-4 py-2">
            <input 
              type="text" 
              value={editingUser.name}
              onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
              className="w-full px-2 py-1 border rounded"
            />
          </td>
          <td className="px-4 py-2">
            <input 
              type="email" 
              value={editingUser.email}
              onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
              className="w-full px-2 py-1 border rounded"
            />
          </td>
          <td className="px-4 py-2">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={editingUser.isAdmin}
                onChange={(e) => setEditingUser({...editingUser, isAdmin: e.target.checked})}
                className="mr-2"
              />
              Admin
            </label>
          </td>
          <td className="px-4 py-2 flex space-x-2">
            <button 
              onClick={() => handleUserAction(editingUser._id, 'update', editingUser)}
              className="text-green-500 hover:text-green-700"
            >
              <Save />
            </button>
            <button 
              onClick={() => setEditingUser(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X />
            </button>
          </td>
        </tr>
      );
    }

    return (
      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-4 py-2">{user.name}</td>
        <td className="px-4 py-2">{user.email}</td>
        <td className="px-4 py-2">
          {user.isAdmin ? 'Admin' : 'User'}
        </td>
        <td className="px-4 py-2 flex space-x-2">
          <button 
            onClick={() => handleEditUser(user)}
            className="text-blue-500 hover:text-blue-700"
          >
            <Edit />
          </button>
          <button 
            onClick={() => handleDeleteUser(user)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 />
          </button>
          {user.isAdmin ? (
            <button 
              onClick={() => handleUserAction(user._id, 'removeAdmin')}
              className="text-yellow-500 hover:text-yellow-700"
            >
              <UserMinus />
            </button>
          ) : (
            <button 
              onClick={() => handleUserAction(user._id, 'makeAdmin')}
              className="text-green-500 hover:text-green-700"
            >
              <UserPlus />
            </button>
          )}
        </td>
      </tr>
    );
  };

  const renderNewUserModal = () => {
    if (!newUserModal) {
      return (
        <button 
          onClick={() => setNewUserModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
        >
          <UserPlus className="mr-2" /> Add New User
        </button>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
          <h2 className="text-xl font-bold mb-4">Add New User</h2>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Full Name"
              value={newUserData.name}
              onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />
            <input 
              type="email" 
              placeholder="Email Address"
              value={newUserData.email}
              onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={newUserData.isAdmin}
                onChange={(e) => setNewUserData({...newUserData, isAdmin: e.target.checked})}
                className="mr-2"
              />
              Make this user an admin
            </label>
            <div className="flex justify-between">
              <button 
                onClick={() => handleUserAction(null, 'create', newUserData)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Create User
              </button>
              <button 
                onClick={() => setNewUserModal(false)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="p-6">
      <ToastContainer />
      
      <ConfirmDialog 
        isOpen={!!deleteConfirmation}
        title="Delete User"
        message={`Are you sure you want to delete user ${deleteConfirmation?.userName}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => handleUserAction(deleteConfirmation.userId, 'delete')}
        onCancel={() => setDeleteConfirmation(null)}
      />

      <div className="mb-4">
        {renderNewUserModal()}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white dark:bg-gray-900 shadow-md rounded-lg">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(renderUserRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
