import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ServerSidebar = ({ servers, activeServer, setActiveServer, fetchServers, token }) => {
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('choose'); // 'choose', 'create', 'join'
    const [serverName, setServerName] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    const handleCreateServer = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/servers`,
                { name: serverName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setServerName('');
            setShowModal(false);
            fetchServers();
            setActiveServer(res.data);
        } catch (error) {
            console.error("Failed to create server", error);
        }
    };

    const handleJoinServer = async (e) => {
        e.preventDefault();
        try {
            const cleanCode = inviteCode.trim();
            const res = await axios.post(`${API_URL}/api/servers/${cleanCode}/join`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInviteCode('');
            setShowModal(false);
            fetchServers();
            setActiveServer(res.data);
        } catch (error) {
            console.error("Failed to join server", error);
            alert(error.response?.data?.message || "Failed to join server. Check the code.");
        }
    };

    return (
        <div className="server-sidebar">
            <div className="home-icon" title="Direct Messages">
                <img src="/discord-logo.png" alt="DevCord" />
            </div>
            <div className="separator"></div>

            {servers.map((server) => (
                <div
                    key={server._id}
                    className={`server-icon ${activeServer?._id === server._id ? 'active' : ''}`}
                    onClick={() => setActiveServer(server)}
                    title={server.name}
                >
                    {server.name.charAt(0).toUpperCase()}
                </div>
            ))}

            <div
                className="add-server-btn"
                onClick={() => { setModalType('choose'); setShowModal(true); }}
                title="Add a Server"
            >
                +
            </div>

            {/* Combined Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        {modalType === 'choose' && (
                            <>
                                <h3>Create a server</h3>
                                <p>Your server is where you and your friends hang out. Make yours and start talking.</p>
                                <button
                                    className="action-btn"
                                    style={{ width: '100%', marginBottom: '12px' }}
                                    onClick={() => setModalType('create')}
                                >
                                    Create My Own
                                </button>
                                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                    <h4 style={{ color: '#f2f3f5', marginBottom: '8px' }}>Have an invite already?</h4>
                                    <button
                                        className="action-btn"
                                        style={{ width: '100%', backgroundColor: '#4e5058' }}
                                        onClick={() => setModalType('join')}
                                    >
                                        Join a Server
                                    </button>
                                </div>
                            </>
                        )}

                        {modalType === 'create' && (
                            <>
                                <h3>Customize your server</h3>
                                <p>Give your new server a personality with a name. You can always change it later.</p>
                                <form onSubmit={handleCreateServer}>
                                    <div className="form-group">
                                        <label>SERVER NAME</label>
                                        <input
                                            type="text"
                                            value={serverName}
                                            onChange={(e) => setServerName(e.target.value)}
                                            placeholder="My Awesome Server"
                                            required
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="cancel-btn" onClick={() => setModalType('choose')}>Back</button>
                                        <button type="submit" className="action-btn">Create</button>
                                    </div>
                                </form>
                            </>
                        )}

                        {modalType === 'join' && (
                            <>
                                <h3>Join a Server</h3>
                                <p>Enter an invite below to join an existing server.</p>
                                <form onSubmit={handleJoinServer}>
                                    <div className="form-group">
                                        <label>INVITE LINK OR SERVER ID</label>
                                        <input
                                            type="text"
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value)}
                                            placeholder="https://devcord.gg/hT62vX (or ID)"
                                            required
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="cancel-btn" onClick={() => setModalType('choose')}>Back</button>
                                        <button type="submit" className="action-btn">Join Server</button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServerSidebar;
