import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [usuario, setUsuario] = useState(() => {
        const guardado = localStorage.getItem('usuario');
        return guardado ? JSON.parse(guardado) : null;
    });

    const login = (nuevoToken, nuevoUsuario) => {
        localStorage.setItem('token', nuevoToken);
        localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
        setToken(nuevoToken);
        setUsuario(nuevoUsuario);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setToken(null);
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{ token, usuario, estaAutenticado: !!token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);