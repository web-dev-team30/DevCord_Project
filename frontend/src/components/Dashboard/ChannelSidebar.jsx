import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ChannelSidebar = ({ activeServer, channels, activeChannel, setActiveChannel, fetchChannels, token, user, logout, openSettings }) => {
    const [showModal, setShowModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [channelName, setChannelName] = useState('');
    const [channelType, setChannelType] = useState('text'); // 'text' or 'voice'

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/channels`,
                { name: channelName, type: channelType, serverId: activeServer._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setChannelName('');
            setChannelType('text');
            setShowModal(false);
            fetchChannels(activeServer._id);
            setActiveChannel(res.data);
        } catch (error) {
            console.error("Failed to create channel", error);
        }
    };

    const textChannels = channels.filter(c => c.type === 'text' || !c.type);
    const voiceChannels = channels.filter(c => c.type === 'voice');

    return (
        <>
            <div className="channel-sidebar">
                <div className="server-header" onClick={() => setShowDropdown(!showDropdown)} style={{ position: 'relative' }}>
                    <h3>{activeServer.name}</h3>
                    <span className="dropdown-icon">{showDropdown ? '✖' : '▼'}</span>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '10px',
                            right: '10px',
                            backgroundColor: '#111214',
                            borderRadius: '4px',
                            padding: '8px',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.24)',
                            zIndex: 100
                        }}>
                            <div
                                style={{ padding: '6px 8px', color: '#5865f2', cursor: 'pointer', borderRadius: '2px', fontSize: '14px', fontWeight: '500', display: 'flex', justifyContent: 'space-between' }}
                                onClick={(e) => { e.stopPropagation(); setShowInviteModal(true); setShowDropdown(false); }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#5865f2'; e.currentTarget.style.color = '#fff'; }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#5865f2'; }}
                            >
                                Invite People
                                <span>✉</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="channels-list">
                    {/* Text Channels */}
                    <div className="channel-category">
                        <span>TEXT CHANNELS</span>
                        <button className="add-channel-btn" onClick={() => { setChannelType('text'); setShowModal(true); }}>+</button>
                    </div>

                    {textChannels.map((channel) => (
                        <div
                            key={channel._id}
                            className={`channel-item ${activeChannel?._id === channel._id ? 'active' : ''}`}
                            onClick={() => setActiveChannel(channel)}
                        >
                            <span className="hash">#</span>
                            <span className="channel-name">{channel.name}</span>
                        </div>
                    ))}

                    {/* Voice Channels */}
                    <div className="channel-category" style={{ marginTop: '16px' }}>
                        <span>VOICE CHANNELS</span>
                        <button className="add-channel-btn" onClick={() => { setChannelType('voice'); setShowModal(true); }}>+</button>
                    </div>

                    {voiceChannels.map((channel) => (
                        <div
                            key={channel._id}
                            className={`channel-item ${activeChannel?._id === channel._id ? 'active' : ''}`}
                            onClick={() => setActiveChannel(channel)}
                        >
                            <span className="hash">🔊</span>
                            <span className="channel-name">{channel.name}</span>
                        </div>
                    ))}
                </div>

                <div className="user-controls">
                    <div className="user-info">
                        <div className="avatar">{user.name?.charAt(0).toUpperCase() || '?'}</div>
                        <div className="user-details">
                            <span className="username">{user.name}</span>
                            <span className="status">Online</span>
                        </div>
                    </div>
                    <div className="user-actions">
                        <button onClick={openSettings} className="logout-icon" title="User Settings">⚙️</button>
                        <button onClick={logout} className="logout-icon" title="Logout" style={{ color: '#f23f43' }}>✖</button>
                    </div>
                </div>
            </div>

            {/* Create Channel Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Create Channel</h3>
                        <p>in {channelType === 'text' ? 'Text Channels' : 'Voice Channels'}</p>
                        <form onSubmit={handleCreateChannel}>
                            <div className="form-group">
                                <label>CHANNEL TYPE</label>
                                <select
                                    style={{ width: '100%', padding: '10px', backgroundColor: '#1e1f22', color: '#dbdee1', border: 'none', borderRadius: '4px', marginBottom: '16px' }}
                                    value={channelType}
                                    onChange={(e) => setChannelType(e.target.value)}
                                >
                                    <option value="text"># Text</option>
                                    <option value="voice">🔊 Voice</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>CHANNEL NAME</label>
                                <div className="input-with-hash">
                                    <span className="hash-prefix">{channelType === 'text' ? '#' : '🔊'}</span>
                                    <input
                                        type="text"
                                        value={channelName}
                                        onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                        placeholder="new-channel"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="action-btn">Create Channel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Invite friends to {activeServer.name}</h3>
                        <p style={{ marginBottom: '16px' }}>Share this Invite Code with others so they can join!</p>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ color: '#b5bac1', fontSize: '12px', fontWeight: 'bold' }}>INVITE CODE</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={activeServer._id}
                                    readOnly
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#1e1f22', color: '#dbdee1', border: 'none', borderRadius: '4px', outline: 'none' }}
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(activeServer._id);
                                        alert('Invite code copied to clipboard!');
                                    }}
                                    style={{ backgroundColor: '#5865f2', color: 'white', border: 'none', borderRadius: '4px', padding: '0 16px', cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Copy
                                </button>
                            </div>
                            <p style={{ color: '#949ba4', fontSize: '12px', marginTop: '8px' }}>Your server ID acts as the permanent invite link.</p>
                        </div>

                        <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className="action-btn" onClick={() => setShowInviteModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChannelSidebar;
