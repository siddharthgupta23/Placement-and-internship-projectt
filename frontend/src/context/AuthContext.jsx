import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { data } = await api.get('/auth/me');
            if (data?.user) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            } else {
                setUser(null);
                localStorage.removeItem('user');
            }
        } catch (err) {
            // Only clear user on explicit 401 unauthorized
            if (err?.response?.status === 401) {
                setUser(null);
                localStorage.removeItem('user');
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        const { data } = await api.post('/auth/login', credentials);
        if (data?.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data.user;
    };

    const signupCompany = async (credentials) => {
        const { data } = await api.post('/auth/signup/company', credentials);
        if (data?.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data.user;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) { }
        setUser(null);
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, signupCompany, logout, checkUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
