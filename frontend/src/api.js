import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5089/api', // Note: Make sure backend runs on 5000
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
