import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data.user || null);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        const { data } = await api.post('/auth/login', credentials);
        setUser(data.user);
        return data.user;
    };

    const signupCompany = async (credentials) => {
        const { data } = await api.post('/auth/signup/company', credentials);
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, login, signupCompany, logout, checkUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
