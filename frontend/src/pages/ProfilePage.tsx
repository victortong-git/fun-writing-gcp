import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { updateUserProfile, uploadProfilePicture, deleteProfilePicture } from '../services/authService';
import { ProfilePictureUpload } from '../components/common/ProfilePictureUpload';
import { setUser } from '../store/slices/authSlice';

const ProfilePage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    ageGroup: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        age: user.age?.toString() || '',
        ageGroup: user.ageGroup || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await updateUserProfile({
        name: formData.name,
        email: formData.email,
        age: formData.age ? parseInt(formData.age) : undefined,
        ageGroup: formData.ageGroup,
      });

      // Update Redux state with new user data
      dispatch(setUser(response.user));

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (file: File) => {
    try {
      const response = await uploadProfilePicture(file);

      // Update Redux state with new user data
      dispatch(setUser(response.user));

      setMessage({
        type: 'success',
        text: 'Profile picture uploaded successfully!',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to upload profile picture',
      });
      throw error;
    }
  };

  const handleProfilePictureDelete = async () => {
    try {
      const response = await deleteProfilePicture();

      // Update Redux state with new user data
      dispatch(setUser(response.user));

      setMessage({
        type: 'success',
        text: 'Profile picture deleted successfully!',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to delete profile picture',
      });
      throw error;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">User Profile</h1>
          <p className="text-slate-600 mt-2">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Edit Profile</h2>

              {message && (
                <div
                  className={`mb-4 p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Profile Picture Upload */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Picture</h3>
                <ProfilePictureUpload
                  currentImageUrl={(user as any).profilePictureUrl}
                  onUpload={handleProfilePictureUpload}
                  onDelete={handleProfilePictureDelete}
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Age */}
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="3"
                    max="99"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your age"
                  />
                </div>

                {/* Age Group */}
                <div>
                  <label htmlFor="ageGroup" className="block text-sm font-medium text-slate-700 mb-2">
                    Age Group
                  </label>
                  <select
                    id="ageGroup"
                    name="ageGroup"
                    value={formData.ageGroup}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select age group</option>
                    <option value="3-5">3-5 years old</option>
                    <option value="5-7">5-7 years old</option>
                    <option value="7-11">7-11 years old</option>
                    <option value="11-14">11-14 years old</option>
                    <option value="14-16">14-16 years old</option>
                    <option value="16+">16+ years old</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* AI Credits Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">AI Credits</h2>

              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mb-4">
                  <svg
                    className="w-10 h-10 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>

                <p className="text-4xl font-bold text-primary-600 mb-2">
                  {user.aiCredits?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-slate-600">Available Credits</p>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Image Generation:</span>
                    <span className="font-semibold">100 credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Video Generation:</span>
                    <span className="font-semibold">500 credits</span>
                  </div>
                </div>
              </div>

              {user.level && (
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Level</span>
                    <span className="text-2xl font-bold text-primary-600">{user.level}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};

export default ProfilePage;
