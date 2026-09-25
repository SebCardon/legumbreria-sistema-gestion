const jwt = require('jsonwebtoken');

// Esta función NUNCA cambia, sin importar el método de login que uses.
// Solo valida el token propio que tu backend emitió en el paso anterior.
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autenticado.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

// Protege todo /api/* excepto /api/auth/* (ahí es donde se pide el token, no donde se exige)
const protegerRutasApi = (req, res, next) => {
    if (req.path.startsWith('/auth')) return next();
    return verificarToken(req, res, next);
};

module.exports = { verificarToken, protegerRutasApi };