import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';
import { setAlert } from '../redux/actions/alertActions';
import axios from 'axios';

const ProfilePage = ({ auth: { user, loading }, setAlert }) => {
  const [formData, setFormData] = useState({
    username: user ? user.username : '',
    email: user ? user.email : '',
    no_telepon: user ? user.no_telepon : '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { username, email, no_telepon, currentPassword, newPassword, confirmPassword } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleProfileUpdate = async e => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const body = JSON.stringify({
        username,
        email,
        no_telepon
      });
      
      const res = await axios.put('/api/auth/profile', body, config);
      
      // Check if email change requires verification
      if (res.data.requiresVerification) {
        setAlert('Email berhasil diubah. Silakan cek email untuk verifikasi.', 'warning');
        // You might want to redirect to verification page or show verification form
      } else {
        setAlert('Profil berhasil diperbarui', 'success');
      }
      
      setIsEditing(false);
    } catch (err) {
      const errorMsg = err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat memperbarui profil';
        
      setAlert(errorMsg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async e => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setAlert('Password baru tidak cocok', 'danger');
      return;
    }
    
    if (newPassword.length < 6) {
      setAlert('Password baru minimal 6 karakter', 'danger');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const body = JSON.stringify({
        currentPassword,
        newPassword
      });
      
      await axios.put('/api/auth/password', body, config);
      
      setAlert('Password berhasil diperbarui', 'success');
      setIsChangingPassword(false);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      const errorMsg = err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat memperbarui password';
        
      setAlert(errorMsg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      
      {/* Alert with proper spacing */}
      <div className="content-with-navbar">
        <Alert />
      </div>
      
      <main className="main-content bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Profil Saya</h2>
            
            {loading || !user ? (
              <Spinner />
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row items-center mb-6">
                  <div className="bg-blue-600 text-white rounded-full w-24 h-24 flex items-center justify-center text-3xl font-bold mb-4 sm:mb-0 sm:mr-6">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{user.username}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <p className="text-gray-600">{user.no_telepon}</p>
                    <div className="mt-2">
                      {user.is_verified ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <i className="fas fa-check-circle mr-1"></i>
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          Belum Verifikasi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6 mt-6">
                  {isEditing ? (
                    <form onSubmit={handleProfileUpdate}>
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-700 mb-2">Nama Pengguna</label>
                          <input
                            type="text"
                            name="username"
                            value={username}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                            required
                          />
                          {email !== user.email && (
                            <p className="text-xs text-yellow-600 mt-1">
                              Mengubah email akan memerlukan verifikasi ulang
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-2">No. Telepon</label>
                          <input
                            type="text"
                            name="no_telepon"
                            value={no_telepon}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              ...formData,
                              username: user.username,
                              email: user.email,
                              no_telepon: user.no_telepon
                            });
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                          disabled={submitting}
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          disabled={submitting}
                        >
                          {submitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  ) : isChangingPassword ? (
                    <form onSubmit={handlePasswordChange}>
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-700 mb-2">Password Saat Ini</label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={currentPassword}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-2">Password Baru</label>
                          <input
                            type="password"
                            name="newPassword"
                            value={newPassword}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                            required
                            minLength="6"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-2">Konfirmasi Password</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={onChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                            required
                            minLength="6"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsChangingPassword(false);
                            setFormData({
                              ...formData,
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: ''
                            });
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                          disabled={submitting}
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          disabled={submitting}
                        >
                          {submitting ? 'Menyimpan...' : 'Ubah Password'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Informasi Akun</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-gray-500 text-sm">Nama Pengguna</p>
                          <p>{user.username}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Email</p>
                          <p>{user.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">No. Telepon</p>
                          <p>{user.no_telepon || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Status Akun</p>
                          {user.is_verified ? (
                            <p className="text-green-600">
                              <i className="fas fa-check-circle mr-2"></i>
                              Terverifikasi
                            </p>
                          ) : (
                            <p className="text-red-600">
                              <i className="fas fa-exclamation-circle mr-2"></i>
                              Belum Verifikasi
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Role</p>
                          <p className="capitalize">{user.role}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Bergabung</p>
                          <p>{new Date(user.created_at).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <i className="fas fa-edit mr-2"></i>
                          Edit Profil
                        </button>
                        <button
                          onClick={() => setIsChangingPassword(true)}
                          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
                        >
                          <i className="fas fa-key mr-2"></i>
                          Ubah Password
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

ProfilePage.propTypes = {
  auth: PropTypes.object.isRequired,
  setAlert: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps, { setAlert })(ProfilePage);