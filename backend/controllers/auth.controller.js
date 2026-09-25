const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ============================================================================
// ÚNICA FUNCIÓN QUE CAMBIARÁ el día que pases a login local.
// Recibe el token de Google, lo verifica, y emite un token PROPIO (JWT).
// Todo lo demás del sistema (middleware, frontend, rutas protegidas) solo
// conoce ese token propio — nunca le importa si viniste por Google o por
// usuario/contraseña. Ese es el punto de cambio, y es el único.
// ============================================================================
const loginConGoogle = async (req, res) => {
    try {
        const { credential } = req.body; // el id_token que entrega Google en el navegador

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        const correosPermitidos = (process.env.ALLOWED_EMAILS || '')
            .split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);

        if (correosPermitidos.length > 0 && !correosPermitidos.includes(email.toLowerCase())) {
            return res.status(403).json({ error: 'Este correo no tiene acceso al sistema.' });
        }

        const [existentes] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [email]);
        let usuario;

        if (existentes.length === 0) {
            const [result] = await pool.query(
                'INSERT INTO usuario (nombre, correo, google_id, id_estado) VALUES (?, ?, ?, 1)',
                [name, email, googleId]
            );
            usuario = { id: result.insertId, nombre: name, correo: email, id_rol: null };
        } else {
            usuario = existentes[0];
            if (!usuario.google_id) {
                await pool.query('UPDATE usuario SET google_id = ? WHERE id = ?', [googleId, usuario.id]);
            }
        }

        // A partir de aquí, todo es genérico: cualquier método de login futuro debe terminar igual.
        const token = jwt.sign(
            { id_usuario: usuario.id, nombre: usuario.nombre, correo: usuario.correo, id_rol: usuario.id_rol },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo } });
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'No se pudo verificar el inicio de sesión con Google.' });
    }
};

module.exports = { loginConGoogle };