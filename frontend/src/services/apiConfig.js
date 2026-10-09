import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Antes de cada petición: adjunta el token guardado
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Después de cada respuesta: si el backend dice 401 y había una sesión guardada,
// la sesión venció. Se limpia y se recarga para volver al login.
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        const habiaSesion = !!localStorage.getItem('token');
        const esRutaDeLogin = url.includes('/auth/');

        if (error.response?.status === 401 && habiaSesion && !esRutaDeLogin) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);