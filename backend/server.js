const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const { protegerRutasApi } = require('./middleware/verificarToken');
const { iniciarLimpiezaAutomatica } = require('./jobs/limpiezaCancelados');

const personasRoutes = require('./routes/personas.routes');
const productosRoutes = require('./routes/productos.routes');
const proveedorRoutes = require('./routes/proveedor.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const presentacionRoutes = require('./routes/presentacion.routes');
const tipoDocumentoRoutes = require('./routes/tipoDocumento.routes');
const rolRoutes = require('./routes/rol.routes');
const estadoRoutes = require('./routes/estado.routes');
const compraRoutes = require('./routes/compra.routes');
const facturaRoutes = require('./routes/factura.routes');
const productosXCompraRoutes = require('./routes/productosXCompra.routes');
const productosXFacturaRoutes = require('./routes/productosXFactura.routes');
const abonoRoutes = require('./routes/abono.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'Backend de la Legumbrería funcionando correctamente' });
});

// Autenticación: todo /api exige token, excepto /api/auth
app.use('/api', protegerRutasApi);
app.use('/api/auth', authRoutes);

// Rutas del sistema
app.use('/api/personas', personasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/presentaciones', presentacionRoutes);
app.use('/api/tipos-documento', tipoDocumentoRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/estados', estadoRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/productos-x-compra', productosXCompraRoutes);
app.use('/api/productos-x-factura', productosXFacturaRoutes);
app.use('/api/abonos', abonoRoutes);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    iniciarLimpiezaAutomatica();
});