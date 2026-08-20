import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CodeBlock from './CodeBlock';
import CodeSnippetModal from './CodeSnippetModal';

const API_URL = import.meta.env.VITE_API_URL;

const ChatArea = ({ activeChannel, activeServer, user, token, socket }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const attachMenuRef = useRef(null);

    // Scroll to bottom every time messages update
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close attachment menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
                setIsAttachMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            if (message.channel === activeChannel._id) {
                setMessages((prev) => [...prev, message]);
            }
        };

        socket.on('receiveMessage', receiveMessage);

        return () => {
            socket.off('receiveMessage', receiveMessage);
        };
    }, [activeChannel, token, socket]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await axios.post(
                `${API_URL}/api/messages`,
                {
                    content: newMessage,
                    channelId: activeChannel._id
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            socket.emit('sendMessage', res.data);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleSendCodeSnippet = async (snippetData) => {
        try {
            const res = await axios.post(
                `${API_URL}/api/messages`,
                {
                    content: '',
                    codeSnippet: snippetData,
                    channelId: activeChannel._id
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            socket.emit('sendMessage', res.data);
        } catch (error) {
            console.error("Failed to send code snippet", error);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAttachMenuOpen(false);
        setIsUploading(true);
        setUploadProgress(`Uploading ${file.name}...`);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await axios.post(`${API_URL}/api/upload/file`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const attachment = {
                url: uploadRes.data.url,
                filename: uploadRes.data.filename || file.name,
                mimetype: uploadRes.data.mimetype || file.type,
                size: uploadRes.data.size || file.size
            };

            // Post message with attachment
            const messageRes = await axios.post(
                `${API_URL}/api/messages`,
                {
                    content: '',
                    attachments: [attachment],
                    channelId: activeChannel._id
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            socket.emit('sendMessage', messageRes.data);
        } catch (error) {
            console.error("File upload failed", error);
            alert("File upload failed. Please try again.");
        } finally {
            setIsUploading(false);
            setUploadProgress('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimetype, filename) => {
        if (mimetype?.startsWith('image/')) return '🖼️';
        if (mimetype?.startsWith('audio/')) return '🎵';
        if (mimetype?.startsWith('video/')) return '🎬';
        if (mimetype?.includes('pdf')) return '📕';
        if (mimetype?.includes('zip') || mimetype?.includes('tar') || mimetype?.includes('rar')) return '📦';
        if (filename?.match(/\.(js|jsx|ts|tsx|py|html|css|json|cpp|sql|java|sh|md)$/i)) return '💻';
        return '📄';
    };

    const renderAttachments = (attachments) => {
        if (!attachments || attachments.length === 0) return null;

        return (
            <div className="message-attachments-container">
                {attachments.map((att, idx) => {
                    const isImage = att.mimetype?.startsWith('image/') || att.filename?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

                    if (isImage) {
                        return (
                            <div key={idx} className="attachment-image-card">
                                <a href={`${API_URL}${att.url}`} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={`${API_URL}${att.url}`}
                                        alt={att.filename || 'attachment'}
                                        className="attachment-img-preview"
                                    />
                                </a>
                            </div>
                        );
                    }

                    return (
                        <div key={idx} className="attachment-file-card">
                            <div className="file-icon-box">{getFileIcon(att.mimetype, att.filename)}</div>
                            <div className="file-details-box">
                                <span className="file-name-text">{att.filename}</span>
                                <span className="file-size-text">{formatBytes(att.size)}</span>
                            </div>
                            <a
                                href={`${API_URL}${att.url}`}
                                download={att.filename}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="download-attachment-btn"
                                title="Download / Open file"
                            >
                                ⬇ Open
                            </a>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderMessageBody = (msg) => {
        return (
            <div className="message-body">
                {/* Text Content */}
                {msg.content && (
                    <div className="message-text">{msg.content}</div>
                )}

                {/* Code Snippet Card */}
                {msg.codeSnippet && msg.codeSnippet.code && (
                    <CodeBlock
                        code={msg.codeSnippet.code}
                        language={msg.codeSnippet.language || 'javascript'}
                        filename={msg.codeSnippet.filename || 'snippet'}
                    />
                )}

                {/* File / Image Attachments */}
                {renderAttachments(msg.attachments)}
            </div>
        );
    };

    return (
        <div className="chat-area">
            {/* Top Bar */}
            <div className="chat-header">
                <span className="hash-icon">#</span>
                <h3>{activeChannel.name}</h3>
                <div className="header-actions">
                    <button
                        type="button"
                        className="share-code-header-btn"
                        onClick={() => setIsCodeModalOpen(true)}
                        title="Share Code Snippet"
                    >
                        <code>&lt;/&gt;</code> Share Code
                    </button>
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
                    <p>This is the start of the #{activeChannel.name} channel. Share files, code & chat!</p>
                </div>

                <div className="messages-list">
                    {messages.map((msg, index) => {
                        const prevMsg = messages[index - 1];
                        const isConsecutive = prevMsg && prevMsg.sender?._id === msg.sender?._id;

                        return (
                            <div key={msg._id} className={`message-item ${isConsecutive ? 'consecutive' : ''}`}>
                                {!isConsecutive && (
                                    <div className="message-avatar">
                                        {msg.sender?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                )}
                                <div className="message-content">
                                    {!isConsecutive && (
                                        <div className="message-header">
                                            <span className="sender-name">{msg.sender?.name}</span>
                                            <span className="timestamp">{formatDate(msg.createdAt)}</span>
                                        </div>
                                    )}
                                    {renderMessageBody(msg)}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Form */}
            <div className="chat-input-wrapper">
                {/* Upload Progress Notification */}
                {isUploading && (
                    <div className="upload-progress-banner">
                        <span className="spinner">⏳</span> {uploadProgress}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="chat-input-form">
                    <div className="input-box" style={{ position: 'relative' }}>
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />

                        {/* Interactive '+' Attachment Trigger */}
                        <div ref={attachMenuRef} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                className="attach-btn"
                                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                                title="Share Files or Code"
                            >
                                +
                            </button>

                            {/* Dropdown Action Menu */}
                            {isAttachMenuOpen && (
                                <div className="attach-dropdown-menu">
                                    <button
                                        type="button"
                                        className="attach-menu-item"
                                        onClick={() => {
                                            setIsAttachMenuOpen(false);
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        <span className="item-icon">📁</span>
                                        <div className="item-text">
                                            <strong>Upload a File / Image</strong>
                                            <small>Share docs, images, zip, audio</small>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        className="attach-menu-item"
                                        onClick={() => {
                                            setIsAttachMenuOpen(false);
                                            setIsCodeModalOpen(true);
                                        }}
                                    >
                                        <span className="item-icon">💻</span>
                                        <div className="item-text">
                                            <strong>Share Code Snippet</strong>
                                            <small>Post formatted code block</small>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Code Snippet Button */}
                        <button
                            type="button"
                            className="code-snippet-trigger-btn"
                            onClick={() => setIsCodeModalOpen(true)}
                            title="Share Code Snippet"
                        >
                            &lt;/&gt;
                        </button>

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

            {/* Code Snippet Modal */}
            <CodeSnippetModal
                isOpen={isCodeModalOpen}
                onClose={() => setIsCodeModalOpen(false)}
                onSendSnippet={handleSendCodeSnippet}
                channelName={activeChannel.name}
            />
        </div>
    );
};

export default ChatArea;
