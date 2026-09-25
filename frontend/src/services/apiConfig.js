import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Interceptor: se ejecuta en CADA petición, justo antes de enviarla.
// Lee el token directamente de localStorage en ese instante, así que
// no depende de que ningún useEffect haya corrido todavía.
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});