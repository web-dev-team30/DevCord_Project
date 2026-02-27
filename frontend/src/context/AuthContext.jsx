import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                localStorage.setItem('token', token);
                try {
                    const res = await axios.get(`${API_URL}/api/users/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser({ id: res.data._id, name: res.data.name, email: res.data.email, avatar: res.data.avatar });
                } catch (err) {
                    console.error("Invalid or expired token", err);
                    logout();
                }
            } else {
                localStorage.removeItem('token');
                setUser(null);
            }
            setLoading(false);
        };
        fetchUser();
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            setToken(res.data.token);
            setUser({ id: res.data._id, name: res.data.name, email: res.data.email, avatar: res.data.avatar });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (name, email, password) => {
        try {
            const res = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
            setToken(res.data.token);
            setUser({ id: res.data._id, name: res.data.name, email: res.data.email, avatar: res.data.avatar });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
