import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ChatArea = ({ activeChannel, activeServer, user, token, socket }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Scroll to bottom every time messages update
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch message history when channel changes
    useEffect(() => {
        if (!activeChannel) return;

        const fetchMessages = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/messages/${activeChannel._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(res.data);
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        fetchMessages();

        // Join socket room
        socket.emit('joinChannel', activeChannel._id);

        // Listen for new messages
        const receiveMessage = (message) => {
            // Only add if it belongs to the current channel
            if (message.channel === activeChannel._id) {
                setMessages((prev) => [...prev, message]);
            }
        };

        socket.on('receiveMessage', receiveMessage);

        // Cleanup listener when channel changes
        return () => {
            socket.off('receiveMessage', receiveMessage);
        };
    }, [activeChannel, token, socket]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            // Save to database first
            const res = await axios.post(
                `${API_URL}/api/messages`,
                {
                    content: newMessage,
                    channelId: activeChannel._id
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Emit the saved message (which now has MongoDB _id and populated sender)
            socket.emit('sendMessage', res.data);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-area">
            {/* Top Bar */}
            <div className="chat-header">
                <span className="hash-icon">#</span>
                <h3>{activeChannel.name}</h3>
                <div className="header-actions">
                    <span className="icon" title="Threads">🧵</span>
                    <span className="icon" title="Notification Settings">🔔</span>
                    <span className="icon" title="Pinned Messages">📌</span>
                    <span className="icon" title="Hide Member List">👥</span>
                </div>
            </div>

            {/* Messages Feed */}
            <div className="messages-container">
                <div className="channel-welcome">
                    <div className="welcome-hash">#</div>
                    <h1>Welcome to #{activeChannel.name}!</h1>
                    <p>This is the start of the #{activeChannel.name} channel.</p>
                </div>

                <div className="messages-list">
                    {messages.map((msg, index) => {
                        // Check if previous message is from same user recently to cluster UI
                        const prevMsg = messages[index - 1];
                        const isConsecutive = prevMsg && prevMsg.sender._id === msg.sender._id;

                        return (
                            <div key={msg._id} className={`message-item ${isConsecutive ? 'consecutive' : ''}`}>
                                {!isConsecutive && (
                                    <div className="message-avatar">
                                        {msg.sender.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                )}
                                <div className="message-content">
                                    {!isConsecutive && (
                                        <div className="message-header">
                                            <span className="sender-name">{msg.sender.name}</span>
                                            <span className="timestamp">{formatDate(msg.createdAt)}</span>
                                        </div>
                                    )}
                                    <div className="message-text">{msg.content}</div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Form */}
            <div className="chat-input-wrapper">
                <form onSubmit={handleSendMessage} className="chat-input-form">
                    <div className="input-box">
                        <button type="button" className="attach-btn">+</button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Message #${activeChannel.name}`}
                        />
                        <div className="input-actions">
                            <button
                                type="submit"
                                className="send-btn"
                                title="Send Message"
                                disabled={!newMessage.trim()}
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatArea;
