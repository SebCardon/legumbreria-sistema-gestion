require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Las fechas (DATETIME) llegan como texto "2026-09-20 02:00:00", exactamente como
    // se registraron, sin convertirlas por zona horaria. Evita que una venta de las
    // 2:00 a. m. aparezca como del día anterior cuando el servidor corre en UTC.
    dateStrings: true
});

module.exports = pool;