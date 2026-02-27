import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

const VoiceArea = ({ activeChannel, user, socket }) => {
    const localVideoRef = useRef(null);
    const [peers, setPeers] = useState({}); // { userId: { name, stream, isVideoOff, isMuted, avatar } }
    const peerConnections = useRef({}); // Store RTCPeerConnection instances
    const localStream = useRef(null);

    // Media State
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    useEffect(() => {
        const startMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStream.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                socket.emit('join-voice', {
                    channelId: activeChannel._id,
                    userId: user.id,
                    userName: user.name,
                    avatar: user.avatar,
                    isVideoOff: false,
                    isMuted: false
                });

            } catch (error) {
                console.error("Error accessing media devices.", error);
            }
        };

        startMedia();

        socket.on('user-connected', async ({ userId, userName, avatar, isVideoOff: remoteVideoOff, isMuted: remoteMuted }) => {
            console.log('User connected', userId);
            const peerConnection = createPeerConnection(userId, userName, avatar, remoteVideoOff, remoteMuted);

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.emit('webrtc-offer', {
                target: userId,
                caller: user.id,
                callerName: user.name,
                callerAvatar: user.avatar,
                sdp: offer
            });
        });

        socket.on('webrtc-offer', async ({ caller, callerName, callerAvatar, sdp }) => {
            const peerConnection = createPeerConnection(caller, callerName, callerAvatar);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socket.emit('webrtc-answer', {
                target: caller,
                responder: user.id,
                sdp: answer
            });
        });

        socket.on('webrtc-answer', async ({ responder, sdp }) => {
            const peerConnection = peerConnections.current[responder];
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
            }
        });

        socket.on('webrtc-ice-candidate', async ({ sender, candidate }) => {
            const peerConnection = peerConnections.current[sender];
            if (peerConnection && candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        socket.on('user-camera-toggled', ({ userId, isVideoOff }) => {
            setPeers(prev => {
                if (!prev[userId]) return prev;
                return { ...prev, [userId]: { ...prev[userId], isVideoOff } };
            });
        });

        socket.on('user-muted-toggled', ({ userId, isMuted }) => {
            setPeers(prev => {
                if (!prev[userId]) return prev;
                return { ...prev, [userId]: { ...prev[userId], isMuted } };
            });
        });

        socket.on('user-disconnected', (userId) => {
            if (peerConnections.current[userId]) {
                peerConnections.current[userId].close();
                delete peerConnections.current[userId];

                setPeers(prev => {
                    const newPeers = { ...prev };
                    delete newPeers[userId];
                    return newPeers;
                });
            }
        });

        return () => {
            if (localStream.current) {
                localStream.current.getTracks().forEach(track => track.stop());
            }
            Object.values(peerConnections.current).forEach(pc => pc.close());
            peerConnections.current = {};
            socket.emit('leave-voice', { channelId: activeChannel._id, userId: user.id });
            socket.off('user-connected');
            socket.off('webrtc-offer');
            socket.off('webrtc-answer');
            socket.off('webrtc-ice-candidate');
            socket.off('user-camera-toggled');
            socket.off('user-muted-toggled');
            socket.off('user-disconnected');
            setPeers({});
        };
    }, [activeChannel, socket, user]);

    const createPeerConnection = (peerId, peerName, avatar, isVideoOff = false, isMuted = false) => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        peerConnections.current[peerId] = peerConnection;

        if (localStream.current) {
            localStream.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream.current);
            });
        }

        peerConnection.ontrack = (event) => {
            setPeers(prev => ({
                ...prev,
                [peerId]: {
                    ...prev[peerId],
                    stream: event.streams[0],
                    name: peerName,
                    avatar,
                    isVideoOff,
                    isMuted
                }
            }));
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc-ice-candidate', {
                    target: peerId,
                    sender: user.id,
                    candidate: event.candidate
                });
            }
        };

        return peerConnection;
    };

    const toggleMute = () => {
        if (localStream.current) {
            const audioTracks = localStream.current.getAudioTracks();
            if (audioTracks.length > 0) {
                const newState = !audioTracks[0].enabled;
                audioTracks[0].enabled = newState;
                setIsMuted(!newState);
                socket.emit('toggle-mute', { channelId: activeChannel._id, userId: user.id, isMuted: !newState });
            }
        }
    };

    const toggleVideo = () => {
        if (localStream.current) {
            const videoTracks = localStream.current.getVideoTracks();
            if (videoTracks.length > 0) {
                const newState = !videoTracks[0].enabled;
                videoTracks[0].enabled = newState;
                setIsVideoOff(!newState);
                socket.emit('toggle-camera', { channelId: activeChannel._id, userId: user.id, isVideoOff: !newState });
            }
        }
    };

    return (
        <div className="voice-area" style={{ flex: 1, backgroundColor: '#313338', display: 'flex', flexDirection: 'column' }}>
            <div className="chat-header">
                <span className="hash-icon">🔊</span>
                <h3>{activeChannel.name}</h3>
                <div style={{ marginLeft: '16px', color: '#23a559', fontSize: '12px', fontWeight: 'bold' }}>
                    VOICE CONNECTED
                </div>
            </div>

            <div className="video-grid" style={{
                flex: 1,
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
                overflowY: 'auto'
            }}>
                {/* Local Video */}
                <div className="video-card" style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', aspectRatio: '16/9' }}>
                    {isVideoOff ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2b2d31' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                backgroundImage: user.avatar ? `url(${API_URL}${user.avatar})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundColor: user.avatar ? 'transparent' : '#5865f2',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: '40px',
                                color: 'white'
                            }}>
                                {!user.avatar && (user.name?.charAt(0).toUpperCase())}
                            </div>
                        </div>
                    ) : (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                        />
                    )}
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isMuted && <span style={{ color: '#ed4245' }}>🔇</span>}
                        {user.name} (You)
                    </div>
                </div>

                {/* Remote Videos */}
                {Object.entries(peers).map(([peerId, peerData]) => (
                    <div key={peerId} className="video-card" style={{ backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', aspectRatio: '16/9' }}>
                        {peerData.isVideoOff ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2b2d31' }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    backgroundImage: peerData.avatar ? `url(${API_URL}${peerData.avatar})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: peerData.avatar ? 'transparent' : '#e91e63',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    fontSize: '40px',
                                    color: 'white'
                                }}>
                                    {!peerData.avatar && (peerData.name?.charAt(0).toUpperCase())}
                                </div>
                            </div>
                        ) : (
                            <video
                                autoPlay
                                playsInline
                                ref={el => { if (el && peerData.stream) el.srcObject = peerData.stream }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {peerData.isMuted && <span style={{ color: '#ed4245' }}>🔇</span>}
                            {peerData.name}
                        </div>
                    </div>
                ))}
            </div>

            <div className="voice-controls" style={{ height: '80px', backgroundColor: '#2b2d31', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
                <button
                    onClick={toggleMute}
                    style={{ width: '56px', height: '56px', borderRadius: '28px', border: 'none', backgroundColor: isMuted ? '#ffffff' : '#313338', color: isMuted ? '#ed4245' : '#dbdee1', fontSize: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>
                <button
                    onClick={toggleVideo}
                    style={{ width: '56px', height: '56px', borderRadius: '28px', border: 'none', backgroundColor: isVideoOff ? '#ffffff' : '#313338', color: isVideoOff ? '#ed4245' : '#dbdee1', fontSize: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}
                    title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                >
                    {isVideoOff ? '🚫' : '📷'}
                </button>
                <button style={{ width: '56px', height: '56px', borderRadius: '28px', border: 'none', backgroundColor: '#ed4245', color: '#ffffff', fontSize: '24px', cursor: 'pointer' }} onClick={() => window.location.reload()}>
                    📞
                </button>
            </div>
        </div>
    );
};

export default VoiceArea;
