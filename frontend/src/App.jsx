import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './index.css';

// A simple protected route wrapper
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// A public route wrapper (don't show login to logged-in users)
const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    if (user) {
        return <Navigate to="/app" replace />;
    }
    return children;
};

function AppRoutes() {
    return (
        <Router>
            <Routes>
                {/* Public slash route goes to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route path="/login" element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } />

                <Route path="/register" element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                } />

                <Route path="/app" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    )
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    )
}

export default App;
