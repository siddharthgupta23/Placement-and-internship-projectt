import axios from 'axios';

const getBaseURL = () => {
    let url = import.meta.env.VITE_API_URL || '';
    if (url) {
        url = url.replace(/\/+$/, '');
        if (!url.endsWith('/api')) {
            url += '/api';
        }
        return url;
    }
    // Relative '/api' works seamlessly across all dev ports (5173, 5174, etc.) via Vite proxy,
    // and in production on Vercel/cloud via reverse proxy.
    // This guarantees session cookies are ALWAYS sent same-origin with 0 CORS/SameSite drops.
    return '/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true, // IMPORTANT for session cookies!
});

export default api;
