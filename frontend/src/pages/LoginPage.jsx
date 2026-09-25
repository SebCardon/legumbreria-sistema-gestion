import { useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const { login } = useAuth();
    const botonRef = useRef(null);

    useEffect(() => {
        const manejarRespuesta = async (response) => {
            try {
                const { data } = await axios.post(`${API_BASE_URL}/auth/google`, {
                    credential: response.credential
                });
                login(data.token, data.usuario);
            } catch (err) {
                console.error(err);
                alert(err.response?.data?.error || 'No se pudo iniciar sesión.');
            }
        };

        if (window.google && botonRef.current) {
            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: manejarRespuesta
            });
            window.google.accounts.id.renderButton(botonRef.current, {
                theme: 'outline', size: 'large', text: 'signin_with'
            });
        }
    }, [login]);

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)'
        }}>
            <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Legumbrería</h1>
            <p style={{ color: 'var(--color-ink-soft)', marginBottom: '28px' }}>Sistema de gestión</p>
            <div ref={botonRef}></div>
        </div>
    );
}

export default LoginPage;