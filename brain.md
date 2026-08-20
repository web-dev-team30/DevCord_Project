# DevCord — Master Architectural Brain & Knowledge Base 🧠

Welcome to **DevCord**, a full-stack real-time communication platform designed specifically for developer teams. DevCord combines text channels, real-time messaging, WebRTC audio/video conferencing, server/channel management, and customized developer user profiles into a seamless experience.

---

## 🏛️ System Architecture

DevCord operates on a decoupled client-server architecture powered by the MERN stack with real-time Socket.io bi-directional messaging and WebRTC mesh networking for voice & video streams.

```
                    ┌────────────────────────────────────────┐
                    │            React 19 Frontend           │
                    │   (Vite + Axios + Socket.io-Client)    │
                    └───────────┬────────────────┬───────────┘
                                │                │
                       HTTP API │                │ Socket.io &
                      (REST/JSON)                │ WebRTC Signaling
                                ▼                ▼
                    ┌────────────────────────────────────────┐
                    │          Express / Node Server         │
                    │       (Auth, API Routes, Socket.io)    │
                    └───────────┬────────────────┬───────────┘
                                │                │
                       Mongoose │                │ Local File
                         ODM    ▼                ▼ Storage
                    ┌───────────────┐        ┌───────────────┐
                    │ MongoDB Cloud │        │ /uploads Dir  │
                    │   Database    │        │ (Avatars/Files│
                    └───────────────┘        └───────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend UI Framework** | React 19, React Router DOM v7 |
| **Build Tooling & Server** | Vite 6, `@vitejs/plugin-react` |
| **HTTP & API Client** | Axios (with credentials & interceptors) |
| **Real-Time Messaging** | Socket.io-client v4.8 |
| **Voice & Video Media** | WebRTC Native Browser APIs (RTCPeerConnection, MediaDevices) |
| **Backend Runtime** | Node.js (ES Modules syntax `"type": "module"`) |
| **Web Server** | Express v5 |
| **Database & ODM** | MongoDB, Mongoose v9 |
| **Real-Time Server** | Socket.io Server v4.8 |
| **Authentication & Security**| JWT (`jsonwebtoken`), `bcrypt`, `cookie-parser`, `cors` |
| **File Storage** | Multer v2 (Static file serving under `/uploads`) |
| **Mail & Notifications** | Nodemailer v8 |

---

## 📁 Repository Directory Structure

```text
DevCord_Project/
├── backend/
│   ├── controllers/         # Business logic for auth, servers, channels, messages
│   ├── middleware/          # JWT authentication & upload middlewares
│   ├── models/              # Mongoose schemas (User, Server, Channel, Message)
│   ├── routes/              # Express API route definitions
│   │   ├── authRoutes.js
│   │   ├── channelRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── serverRoutes.js
│   │   ├── uploadRoutes.js
│   │   └── userRoutes.js
│   ├── uploads/             # Static file storage for avatars and attachments
│   ├── utils/               # Helper utilities (token generation, mailers)
│   ├── .env                 # Environment variables (MONGO_URI, JWT_SECRET, PORT)
│   ├── package.json
│   └── server.js            # Express app, HTTP server, and Socket.io event engine
│
└── frontend/
    ├── public/              # Static public assets
    ├── src/
    │   ├── components/
    │   │   └── Dashboard/
    │   │       ├── ChannelSidebar.jsx   # Text & Voice channel list + channel creation
    │   │       ├── ChatArea.jsx         # Real-time text channel messaging & file attachments
    │   │       ├── ServerSidebar.jsx    # Joined server list, icon bar, server modal
    │   │       ├── UserSettings.jsx     # Profile editing, avatar upload, password reset
    │   │       └── VoiceArea.jsx        # WebRTC grid, mic/cam toggle, peer video streams
    │   ├── context/
    │   │   └── AuthContext.jsx       # Global user auth state, login/logout providers
    │   ├── pages/
    │   │   ├── Auth.css             # Styling for login & registration
    │   │   ├── Dashboard.css        # Layout grid & core workspace styling
    │   │   ├── Dashboard.jsx        # Root dashboard view orchestrating sidebar/chat/voice
    │   │   ├── Login.jsx            # User authentication login view
    │   │   └── Register.jsx         # New user registration view
    │   ├── App.jsx                  # React Router routes & auth guards
    │   ├── index.css                # Global CSS resets & root custom properties
    │   └── main.jsx                 # React root mount point
    ├── package.json
    └── vite.config.js               # Vite build configuration
```

---

## 🗄️ Database Schemas & Data Models

### 1. User (`User.js`)
- `username`: String (Required, Unique, Trimmed)
- `email`: String (Required, Unique, Lowercase)
- `password`: String (Hashed via bcrypt)
- `avatar`: String (URL path to uploaded image or fallback gravatar)
- `status`: String (Enum: `online`, `idle`, `dnd`, `offline`)
- `customStatus`: String (Optional status message)
- `createdAt` / `updatedAt`: Timestamps

### 2. Server (`Server.js`)
- `name`: String (Required)
- `icon`: String (Optional server avatar image)
- `owner`: ObjectId → User (Server creator/admin)
- `members`: Array of ObjectIds → User
- `channels`: Array of ObjectIds → Channel
- `inviteCode`: String (Unique join code)

### 3. Channel (`Channel.js`)
- `name`: String (Required)
- `type`: String (Enum: `text`, `voice`)
- `server`: ObjectId → Server
- `topic`: String (Optional topic banner)

### 4. Message (`Message.js`)
- `sender`: ObjectId → User (Populated with `username` & `avatar`)
- `channel`: ObjectId → Channel
- `content`: String (Message text body)
- `attachments`: Array of Strings (File upload paths)
- `createdAt`: Timestamp

---

## ⚡ Socket.io & WebRTC Real-Time Events Protocol

### Text Channel Events
| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `joinChannel` | Client → Server | `channelId: string` | Joins socket to specified channel room |
| `sendMessage` | Client → Server | `messageObject` | Transmits a newly created message |
| `receiveMessage`| Server → Client | `messageObject` | Broadcasts message to all clients in channel room |

### Voice & Video WebRTC Events
| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-voice` | Client → Server | `{ channelId, userId, userName }` | Joins voice room and notifies existing peers |
| `user-connected`| Server → Client | `{ userId, userName }` | Notifies room peers to initiate WebRTC offer |
| `webrtc-offer` | Client ↔ Server | `{ offer, targetUserId, callerId }` | Relays SDP offer to peer |
| `webrtc-answer` | Client ↔ Server | `{ answer, targetUserId, responderId }` | Relays SDP answer back to caller |
| `webrtc-ice-candidate` | Client ↔ Server | `{ candidate, targetUserId }` | Exchanges ICE candidates for NAT traversal |
| `toggle-mute` | Client → Server | `{ channelId, userId, isMuted }` | Syncs microphone state with connected peers |
| `toggle-camera` | Client → Server | `{ channelId, userId, isVideoOff }` | Syncs camera state with connected peers |
| `leave-voice` | Client → Server | `{ channelId, userId }` | Gracefully closes connections and leaves room |

---

## 🌐 REST API Endpoints

### Authentication (`/api/auth`)
- `POST /register`: Create a new user account.
- `POST /login`: Authenticate user and issue JWT cookie/token.
- `POST /logout`: Clear auth credentials.
- `GET /me`: Retrieve current logged-in user profile.

### Server Operations (`/api/servers`)
- `GET /`: Get all servers the current user belongs to.
- `POST /`: Create a new server.
- `POST /join`: Join a server using an `inviteCode`.
- `DELETE /:id`: Delete a server (Owner only).

### Channel Operations (`/api/channels`)
- `POST /`: Create a new text or voice channel inside a server.
- `GET /server/:serverId`: Fetch all channels for a server.

### Message Operations (`/api/messages`)
- `GET /:channelId`: Fetch historical messages for a channel.
- `POST /`: Create and save a new message.

### Profile & Uploads (`/api/users` & `/api/upload`)
- `PUT /api/users/profile`: Update user profile details.
- `POST /api/upload`: Upload media/avatar files via Multer.

---

## ⚙️ Environment & Local Setup Guide

### Backend `.env` Configuration
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devcord
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env` Configuration
```env
VITE_API_URL=http://localhost:5000
```

### Quick Commands

#### Start Backend Engine
```bash
cd backend
npm install
npm start
```

#### Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```

---

## 📌 Architecture Notes & Key Guidelines
1. **CORS Normalization**: `server.js` strips trailing slashes from incoming origins to ensure standard pre-flight OPTIONS authorization.
2. **DNS Fallback**: `server.js` sets Google Public DNS (`8.8.8.8`) at boot time to prevent local ISP SRV resolution issues when connecting to MongoDB Atlas.
3. **WebRTC Mesh**: Voice channels currently use full-mesh Peer-to-Peer connections, ideal for small developer teams.
