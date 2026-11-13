import axios from 'axios';

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5089/api';
        }
        // In production on Vercel or custom domain, relative path '/api' stays same-origin so cookies are never blocked
        return '/api';
    }
    return 'http://localhost:5089/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true, // IMPORTANT for session cookies!
});

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       alert("Session expired. Please login again.");
//       window.location.href = "/login"; // redirect
//     }
//     return Promise.reject(err);
//   }
// );

export default api;
