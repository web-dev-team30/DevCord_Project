import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import ServerSidebar from '../components/Dashboard/ServerSidebar';
import ChannelSidebar from '../components/Dashboard/ChannelSidebar';
import ChatArea from '../components/Dashboard/ChatArea';
import VoiceArea from '../components/Dashboard/VoiceArea';
import UserSettings from '../components/Dashboard/UserSettings';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

// Initialize socket connection
const socket = io(API_URL, {
    withCredentials: true,
    autoConnect: false // We connect it manually when auth is ready
});

const Dashboard = () => {
    const { user, token, logout } = useAuth();
    const [servers, setServers] = useState([]);
    const [activeServer, setActiveServer] = useState(null);
    const [channels, setChannels] = useState([]);
    const [activeChannel, setActiveChannel] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    // Initial fetch for user's servers
    useEffect(() => {
        if (token) {
            socket.auth = { token };
            socket.connect();
            fetchServers();
        }
        return () => {
            socket.disconnect();
        };
    }, [token]);

    const fetchServers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/servers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setServers(res.data);
            if (res.data.length > 0) {
                setActiveServer(res.data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch servers", error);
        }
    };

    const fetchChannels = async (serverId) => {
        try {
            const res = await axios.get(`${API_URL}/api/channels/${serverId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChannels(res.data);
            if (res.data.length > 0) {
                setActiveChannel(res.data[0]);
            } else {
                setActiveChannel(null);
            }
        } catch (error) {
            console.error("Failed to fetch channels", error);
        }
    };

    // When active server changes, fetch its channels
    useEffect(() => {
        if (activeServer) {
            fetchChannels(activeServer._id);
        }
    }, [activeServer]);

    return (
        <div className="dashboard-container">
            {showSettings && <UserSettings onClose={() => setShowSettings(false)} />}

            <ServerSidebar
                servers={servers}
                activeServer={activeServer}
                setActiveServer={setActiveServer}
                fetchServers={fetchServers}
                token={token}
            />

            {activeServer ? (
                <>
                    <ChannelSidebar
                        activeServer={activeServer}
                        channels={channels}
                        activeChannel={activeChannel}
                        setActiveChannel={setActiveChannel}
                        fetchChannels={fetchChannels}
                        token={token}
                        user={user}
                        logout={logout}
                        openSettings={() => setShowSettings(true)}
                    />

                    {activeChannel ? (
                        activeChannel.type === 'voice' ? (
                            <VoiceArea
                                activeChannel={activeChannel}
                                user={user}
                                socket={socket}
                                onLeave={() => setActiveChannel(null)}
                            />
                        ) : (
                            <ChatArea
                                activeChannel={activeChannel}
                                activeServer={activeServer}
                                user={user}
                                token={token}
                                socket={socket}
                            />
                        )
                    ) : (
                        <div className="chat-placeholder">
                            <div className="no-channel-message">
                                <h3>No channels found</h3>
                                <p>Create a channel to start talking!</p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="dashboard-placeholder">
                    <div className="welcome-server-msg">
                        <img src="/discord-logo.png" alt="DevCord Logo" />
                        <h2>Welcome to DevCord!</h2>
                        <p>Create or join a server on the left sidebar to get started.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
