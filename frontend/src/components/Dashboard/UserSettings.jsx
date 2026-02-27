import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const UserSettings = ({ onClose }) => {
    const { token, user: contextUser, logout } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setName(res.data.name);
                setEmail(res.data.email);
                setAvatar(res.data.avatar);
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        }
    }, [token]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setSaving(true);
            const res = await axios.post(`${API_URL}/api/upload/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            setAvatar(res.data.avatar);
            setMessage({ type: 'success', text: 'Avatar uploaded!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Avatar upload failed' });
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const updatePayload = { name, email };
            if (password) updatePayload.password = password;

            const res = await axios.put(`${API_URL}/api/users/me`, updatePayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setPassword(''); // clear password field after saving

            // Optionally, we could update the AuthContext user here if we exposed a setter,
            // but for a simple reload to apply the newest username across the socket/UI immediately:
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error("Failed to update profile", error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-overlay">
                <div className="settings-content">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="settings-overlay">
            <div className="settings-sidebar">
                <div className="settings-nav">
                    <h3>USER SETTINGS</h3>
                    <div className="nav-item active">My Account</div>
                    <div className="nav-item">Profiles</div>
                    <div className="nav-item">Privacy & Safety</div>

                    <div className="nav-divider"></div>

                    <div className="nav-item logout" onClick={logout}>Log Out</div>
                </div>
            </div>

            <div className="settings-main">
                <div className="settings-header">
                    <h2>My Account</h2>
                </div>

                <div className="profile-card">
                    <div className="profile-banner"></div>
                    <div className="profile-info">
                        <div className="profile-avatar large" style={{
                            backgroundImage: avatar ? `url(${API_URL}${avatar})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: avatar ? 'transparent' : '#23a559'
                        }}>
                            {!avatar && (name?.charAt(0).toUpperCase() || '?')}
                            <div className="status-indicator"></div>

                            <label className="avatar-edit-overlay" htmlFor="avatar-upload">
                                <span>CHANGE AVATAR</span>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </label>
                        </div>
                        <div className="profile-details">
                            <h3>{name}</h3>
                            <p>{email}</p>
                        </div>
                    </div>

                    <div className="edit-form-container">
                        <form onSubmit={handleSave}>
                            {message && (
                                <div className={`message-banner ${message.type}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="form-group row">
                                <div className="input-half">
                                    <label>USERNAME</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-half">
                                    <label>EMAIL</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>NEW PASSWORD (Optional)</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave blank to keep current password"
                                />
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="save-btn" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="close-btn-container" onClick={onClose} title="Close (ESC)">
                    <div className="close-btn">
                        <span>×</span>
                    </div>
                    <span>ESC</span>
                </div>
            </div>

            <style>{`
                .settings-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #313338;
                    z-index: 9999;
                    display: flex;
                    color: #dbdee1;
                    animation: fadeIn 0.15s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(1.05); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                .settings-sidebar {
                    width: 30%;
                    background-color: #2b2d31;
                    display: flex;
                    justify-content: flex-end;
                    padding-right: 20px;
                }
                
                .settings-nav {
                    width: 250px;
                    padding-top: 60px;
                }
                
                .settings-nav h3 {
                    font-size: 12px;
                    color: #949ba4;
                    margin-bottom: 8px;
                    padding-left: 10px;
                }
                
                .nav-item {
                    padding: 8px 10px;
                    margin-bottom: 2px;
                    border-radius: 4px;
                    cursor: pointer;
                    color: #b5bac1;
                    font-weight: 500;
                }
                
                .nav-item:hover {
                    background-color: #35373c;
                    color: #dbdee1;
                }
                
                .nav-item.active {
                    background-color: #404249;
                    color: #fff;
                }
                
                .nav-divider {
                    height: 1px;
                    background-color: #3f4147;
                    margin: 10px 10px 10px 10px;
                }
                
                .nav-item.logout {
                    color: #f23f43;
                }
                
                .nav-item.logout:hover {
                    background-color: rgba(242, 63, 67, 0.1);
                }
                
                .settings-main {
                    flex: 1;
                    background-color: #313338;
                    padding: 60px 40px;
                    position: relative;
                    max-width: 800px;
                }
                
                .settings-header h2 {
                    font-size: 20px;
                    color: #fff;
                    margin-bottom: 24px;
                }
                
                .profile-card {
                    background-color: #1e1f22;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                
                .profile-banner {
                    height: 100px;
                    background-color: #5865f2;
                }
                
                .profile-info {
                    padding: 0 20px 20px;
                    display: flex;
                    align-items: flex-end;
                    margin-top: -40px;
                    margin-bottom: 20px;
                }
                
                .profile-avatar.large {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    border: 6px solid #1e1f22;
                    background-color: #23a559;
                    font-size: 32px;
                    position: relative;
                }
                
                .status-indicator {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background-color: #23a559;
                    border: 4px solid #1e1f22;
                }
                
                .avatar-edit-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0,0,0,0.5);
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                    cursor: pointer;
                    text-align: center;
                    padding: 10px;
                }
                
                .avatar-edit-overlay span {
                    font-size: 10px;
                    font-weight: bold;
                    color: #fff;
                }
                
                .profile-avatar.large:hover .avatar-edit-overlay {
                    opacity: 1;
                }
                
                .profile-details {
                    margin-left: 16px;
                    padding-bottom: 4px;
                }
                
                .profile-details h3 {
                    font-size: 20px;
                    color: #fff;
                    line-height: 1;
                    margin-bottom: 4px;
                }
                
                .profile-details p {
                    font-size: 14px;
                    color: #b5bac1;
                }
                
                .edit-form-container {
                    padding: 24px;
                    background-color: #2b2d31;
                    margin: 16px;
                    border-radius: 8px;
                }
                
                .form-group.row {
                    display: flex;
                    gap: 16px;
                }
                
                .input-half {
                    flex: 1;
                }
                
                .edit-form-container label {
                    display: block;
                    font-size: 12px;
                    font-weight: 700;
                    color: #949ba4;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }
                
                .edit-form-container input {
                    width: 100%;
                    padding: 10px;
                    background-color: #1e1f22;
                    border: none;
                    border-radius: 4px;
                    color: #dbdee1;
                    font-size: 15px;
                    margin-bottom: 16px;
                    outline: none;
                }
                
                .edit-form-container input:focus {
                    border-bottom: 1px solid #00a8fc;
                }
                
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 10px;
                }
                
                .save-btn {
                    background-color: #5865f2;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 4px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                
                .save-btn:hover {
                    background-color: #4752c4;
                }
                
                .save-btn:disabled {
                    background-color: #4752c4;
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                .message-banner {
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 16px;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .message-banner.success {
                    background-color: rgba(35, 165, 89, 0.1);
                    color: #23a559;
                    border: 1px solid rgba(35, 165, 89, 0.5);
                }
                
                .message-banner.error {
                    background-color: rgba(242, 63, 67, 0.1);
                    color: #f23f43;
                    border: 1px solid rgba(242, 63, 67, 0.5);
                }
                
                .close-btn-container {
                    position: absolute;
                    top: 60px;
                    right: 40px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    color: #949ba4;
                }
                
                .close-btn-container:hover {
                    color: #dbdee1;
                }
                
                .close-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 2px solid currentcolor;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 24px;
                    margin-bottom: 4px;
                }
                
                .close-btn-container span:last-child {
                    font-size: 12px;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default UserSettings;
