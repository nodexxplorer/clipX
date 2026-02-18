/**
 * Profile Page
 * User profile with settings, preferences, and account management
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  FiUser, FiMail, FiCamera, FiEdit2, FiSave, FiLock, 
  FiTrash2, FiBell, FiMonitor, FiLogOut, FiCheck, FiX
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Modal from '@/components/common/Modal';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile, logout, loading: authLoading } = useAuth();
  const { setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state - Initialize from user
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    autoPlayTrailers: true,
    theme: 'dark'
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
      
      const savedTheme = user.preferences?.theme || 'dark';
      setPreferences({
        emailNotifications: user.preferences?.emailNotifications ?? true,
        autoPlayTrailers: user.preferences?.autoPlayTrailers ?? true,
        theme: savedTheme
      });

      // Apply user's saved theme preference immediately
      try {
        // useTheme may not be available during SSR; guard with window
        if (typeof window !== 'undefined') {
          setTheme(savedTheme);
        }
      } catch (err) {
        // ignore if theme provider not available
      }
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });

      // Validate form
      if (!formData.name || formData.name.trim() === '') {
        setMessage({ type: 'error', text: 'Name is required' });
        setIsSaving(false);
        return;
      }

      console.log('Saving profile with data:', formData);

      const result = await updateProfile({
        name: formData.name.trim(),
        bio: formData.bio?.trim() || '',
        avatar: formData.avatar || ''
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });

      console.log('Saving preferences:', preferences);

      const result = await updateProfile({ 
        preferences: {
          theme: preferences.theme,
          emailNotifications: preferences.emailNotifications,
          autoPlayTrailers: preferences.autoPlayTrailers
        }
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleCancelEdit = () => {
    // Reset form to user data
    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      avatar: user.avatar || ''
    });
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'preferences', label: 'Preferences', icon: FiMonitor },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'notifications', label: 'Notifications', icon: FiBell }
  ];

  return (
    <>
      <Head>
        <title>Profile - clipX</title>
      </Head>

      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex mt-12 items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Message */}
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {message.type === 'success' ? <FiCheck /> : <FiX />}
              {message.text}
            </motion.div>
          )}

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="md:w-64 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMessage({ type: '', text: '' });
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-800 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 text-primary-400 hover:text-primary-300"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-gray-400 hover:text-white"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <FiSave className="w-4 h-4" />
                              Save
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <button 
                          className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center hover:bg-primary-700"
                          title="Upload avatar (coming soon)"
                        >
                          <FiCamera className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{user.name}</h3>
                      <p className="text-gray-400">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Member since {(() => {
                          if (!user.created_at) return 'Recently';
                          
                          try {
                            const date = new Date(user.created_at);
                            // Check if date is valid
                            if (isNaN(date.getTime())) {
                              console.log('Invalid date format:', user.created_at);
                              return 'Recently';
                            }
                            return date.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                          } catch (error) {
                            console.error('Date parsing error:', error);
                            return 'Recently';
                          }
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Your name"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Email
                      </label>
                      <div className="flex items-center gap-2">
                        <FiMail className="w-5 h-5 text-gray-500" />
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!isEditing}
                        rows={3}
                        placeholder="Tell us about yourself..."
                        maxLength={500}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:border-primary-500 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.bio.length}/500 characters
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-800 rounded-xl p-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-6">Preferences</h2>
                  
                  <div className="space-y-6">
                    <ToggleSetting
                      label="Auto-play trailers"
                      description="Automatically play trailers when viewing movie details"
                      checked={preferences.autoPlayTrailers}
                      onChange={(val) => setPreferences({ ...preferences, autoPlayTrailers: val })}
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                      <select
                        value={preferences.theme}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPreferences({ ...preferences, theme: val });
                          try { setTheme(val); } catch (err) { /* ignore if provider missing */ }
                        }}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                    className="mt-6 flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      'Save Preferences'
                    )}
                  </button>
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
                    <p className="text-gray-400 mb-4">Update your password to keep your account secure.</p>
                    <button 
                      onClick={() => router.push('/auth/change-password')}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                      Change Password
                    </button>
                  </div>

                  <div className="bg-gray-800 rounded-xl p-6 border border-red-500/20">
                    <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
                    <p className="text-gray-400 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-800 rounded-xl p-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-6">Notification Settings</h2>
                  
                  <div className="space-y-6">
                    <ToggleSetting
                      label="Email notifications"
                      description="Receive updates about new releases and recommendations"
                      checked={preferences.emailNotifications}
                      onChange={(val) => setPreferences({ ...preferences, emailNotifications: val })}
                    />
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                    className="mt-6 flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Account?</h3>
              <p className="text-gray-400 mb-6">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    // TODO: Implement account deletion
                    console.log('Delete account');
                    setShowDeleteModal(false);
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}

// Toggle Setting Component
function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-600'
        }`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'left-7' : 'left-1'
        }`} />
      </button>
    </div>
  );
}