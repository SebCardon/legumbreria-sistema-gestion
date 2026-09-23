import { useState, useEffect } from 'react';
import { getProductosXCompraByCompra, updateProductoXCompra, deleteProductoXCompra } from '../services/productosXCompraService';
import { getProductos } from '../services/productosService';
import { getPresentaciones } from '../services/presentacionService';
import { getCompras } from '../services/compraService';
import { getProveedores } from '../services/proveedorService';
import { formatMoneda } from '../utils/format';
import TablaGenerica from '../components/TablaGenerica';

function ProductosXCompraPage() {
    const [productos, setProductos] = useState([]);
    const [presentaciones, setPresentaciones] = useState([]);
    const [compras, setCompras] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [cargandoDatos, setCargandoDatos] = useState(true);

    const [idCompraSeleccionada, setIdCompraSeleccionada] = useState('');
    const [lineasCompra, setLineasCompra] = useState([]);
    const [cargandoLineas, setCargandoLineas] = useState(false);
    const [editando, setEditando] = useState(null);

    const cargarDatosIniciales = async () => {
        setCargandoDatos(true);
        const [dataProductos, dataPresentaciones, dataCompras, dataProveedores] = await Promise.all([
            getProductos(), getPresentaciones(), getCompras(), getProveedores()
        ]);
        setProductos(dataProductos);
        setPresentaciones(dataPresentaciones);
        setCompras(dataCompras);
        setProveedores(dataProveedores);
        setCargandoDatos(false);
    };

    useEffect(() => { cargarDatosIniciales(); }, []);

    const nombreProveedor = (id) => {
        const p = proveedores.find((prov) => prov.id === id);
        return p ? p.nombre : `ID ${id}`;
    };

    const nombreProducto = (id) => {
        const p = productos.find((prod) => prod.id === id);
        return p ? p.nombre : `ID ${id}`;
    };

    const nombrePresentacion = (id) => {
        const p = presentaciones.find((pres) => pres.id === id);
        return p ? p.nombre : `ID ${id}`;
    };

    const cargarLineas = async (idCompra) => {
        if (!idCompra) {
            setLineasCompra([]);
            return;
        }
        setCargandoLineas(true);
        const data = await getProductosXCompraByCompra(idCompra);
        setLineasCompra(data);
        setCargandoLineas(false);
    };

    const handleSeleccionarCompra = (id) => {
        setIdCompraSeleccionada(id);
        setEditando(null);
        cargarLineas(id);
    };

    const columnas = [
        { campo: 'id', titulo: 'ID' },
        { campo: 'id_producto', titulo: 'Producto', render: (fila) => nombreProducto(fila.id_producto) },
        { campo: 'id_presentacion', titulo: 'Presentación', render: (fila) => nombrePresentacion(fila.id_presentacion) },
        { campo: 'peso_total_kg', titulo: 'Peso (Kg)' },
        { campo: 'precio_por_kg', titulo: 'Precio/Kg', render: (fila) => formatMoneda(fila.precio_por_kg) },
        { campo: 'subtotal', titulo: 'Subtotal', render: (fila) => formatMoneda(fila.subtotal) }
    ];

    const handleEditar = (fila) => setEditando({ ...fila });
    const handleCancelarEdicion = () => setEditando(null);

    const handleChangeEdicion = (campo, valor) => {
        setEditando((prev) => ({ ...prev, [campo]: valor }));
    };

    const subtotalEdicion = editando
        ? (Number(editando.peso_total_kg) || 0) * (Number(editando.precio_por_kg) || 0)
        : 0;

    const handleGuardarEdicion = async (e) => {
        e.preventDefault();
        try {
            await updateProductoXCompra(editando.id, { ...editando, subtotal: subtotalEdicion });
            setEditando(null);
            cargarLineas(idCompraSeleccionada);
        } catch (err) {
            console.error(err);
            alert('Error al guardar los cambios.');
        }
    };

    const handleEliminar = async (fila) => {
        if (!window.confirm('¿Eliminar este producto de la compra?')) return;
        try {
            await deleteProductoXCompra(fila.id);
            cargarLineas(idCompraSeleccionada);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al eliminar.');
        }
    };

    if (cargandoDatos) return <p>Cargando datos...</p>;

    const comprasOrdenadas = [...compras].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return (
        <div>
            <h2>Detalle de Compras — Correcciones</h2>
            <p style={{ color: 'var(--color-ink-soft)', marginTop: '-12px', marginBottom: '16px', fontSize: '13px' }}>
                Selecciona una compra para ver y corregir únicamente sus productos.
            </p>

            <select
                value={idCompraSeleccionada}
                onChange={(e) => handleSeleccionarCompra(e.target.value)}
                style={{ marginBottom: '16px', maxWidth: '420px' }}
            >
                <option value="">-- Selecciona una compra --</option>
                {comprasOrdenadas.map((c) => (
                    <option key={c.id} value={c.id}>
                        #{c.id} — {nombreProveedor(c.id_proveedor)} — {c.fecha ? c.fecha.slice(0, 10) : ''} — {formatMoneda(c.total_compra)}
                    </option>
                ))}
            </select>

            {!idCompraSeleccionada && (
                <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px' }}>
                    Elige una compra arriba para ver sus productos.
                </p>
            )}

            {idCompraSeleccionada && cargandoLineas && <p>Cargando productos de la compra...</p>}

            {idCompraSeleccionada && !cargandoLineas && (
                <>
                    {editando && (
                        <form onSubmit={handleGuardarEdicion} style={{ marginBottom: '16px' }}>
                            <select value={editando.id_producto} onChange={(e) => handleChangeEdicion('id_producto', e.target.value)} required>
                                {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                            <select value={editando.id_presentacion} onChange={(e) => handleChangeEdicion('id_presentacion', e.target.value)} required>
                                {presentaciones.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                            <input type="number" step="0.01" value={editando.peso_total_kg} onChange={(e) => handleChangeEdicion('peso_total_kg', e.target.value)} required />
                            <input type="number" step="0.01" value={editando.precio_por_kg} onChange={(e) => handleChangeEdicion('precio_por_kg', e.target.value)} required />
                            <span>Subtotal: {formatMoneda(subtotalEdicion)}</span>
                            <button type="submit">Guardar cambios</button>
                            <button type="button" onClick={handleCancelarEdicion}>Cancelar</button>
                        </form>
                    )}

                    {lineasCompra.length === 0 ? (
                        <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px' }}>Esta compra no tiene productos registrados.</p>
                    ) : (
                        <TablaGenerica
                            columnas={columnas}
                            datos={lineasCompra}
                            acciones={[
                                { etiqueta: 'Editar', onClick: handleEditar },
                                { etiqueta: 'Eliminar', onClick: handleEliminar, tipo: 'peligro' }
                            ]}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default ProductosXCompraPage;