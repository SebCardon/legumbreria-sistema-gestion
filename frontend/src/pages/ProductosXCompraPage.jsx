import { useState, useEffect } from 'react';
import { getProductosXCompra, updateProductoXCompra, deleteProductoXCompra } from '../services/productosXCompraService';
import { getProductos } from '../services/productosService';
import { getPresentaciones } from '../services/presentacionService';
import { getCompras } from '../services/compraService';
import TablaGenerica from '../components/TablaGenerica';
import { formatMoneda, formatNumero } from '../utils/format';

function ProductosXCompraPage() {
    const [items, setItems] = useState([]);
    const [productos, setProductos] = useState([]);
    const [presentaciones, setPresentaciones] = useState([]);
    const [compras, setCompras] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [editando, setEditando] = useState(null);

    const cargar = async () => {
        setCargando(true);
        const [dataItems, dataProductos, dataPresentaciones, dataCompras] = await Promise.all([
            getProductosXCompra(), getProductos(), getPresentaciones(), getCompras()
        ]);
        setItems(dataItems);
        setProductos(dataProductos);
        setPresentaciones(dataPresentaciones);
        setCompras(dataCompras);
        setCargando(false);
    };

    useEffect(() => { cargar(); }, []);

    const nombreProducto = (id) => {
        const p = productos.find((prod) => prod.id === id);
        return p ? p.nombre : `ID ${id}`;
    };

    const nombrePresentacion = (id) => {
        const p = presentaciones.find((pres) => pres.id === id);
        return p ? p.nombre : `ID ${id}`;
    };

    const referenciaCompra = (id) => {
        const c = compras.find((compra) => compra.id === id);
        return c ? `#${c.id} — ${c.fecha ? c.fecha.slice(0, 10) : ''}` : `ID ${id}`;
    };

    const columnas = [
        { campo: 'id', titulo: 'ID' },
        { campo: 'id_compra', titulo: 'Compra', render: (fila) => referenciaCompra(fila.id_compra) },
        { campo: 'id_producto', titulo: 'Producto', render: (fila) => nombreProducto(fila.id_producto) },
        { campo: 'id_presentacion', titulo: 'Presentación', render: (fila) => nombrePresentacion(fila.id_presentacion) },
        { campo: 'peso_total_kg', titulo: 'Peso (Kg)', render: (fila) => formatNumero(fila.peso_total_kg) },
        { campo: 'precio_por_kg', titulo: 'Precio/Kg', render: (fila) => formatMoneda(fila.precio_por_kg) },
        { campo: 'subtotal', titulo: 'Subtotal', render: (fila) => formatMoneda(fila.subtotal) }
    ];

    const handleEditar = (fila) => setEditando({ ...fila });
    const handleCancelar = () => setEditando(null);

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
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al guardar los cambios.');
        }
    };

    const handleEliminar = async (fila) => {
        if (!window.confirm('¿Eliminar este detalle de compra? Esto NO ajusta el stock automáticamente.')) return;
        try {
            await deleteProductoXCompra(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al eliminar.');
        }
    };

    if (cargando) return <p>Cargando detalle de compras...</p>;

    return (
        <div>
            <h2>Detalle de Compras — Correcciones</h2>
            <p style={{ color: 'var(--color-ink-soft)', marginTop: '-12px', marginBottom: '16px', fontSize: '13px' }}>
                Para registrar una compra nueva, usa "Nueva Compra" en el menú. Aquí solo se corrigen o eliminan líneas ya existentes.
            </p>

            {editando && (
                <form onSubmit={handleGuardarEdicion}>
                    <select value={editando.id_producto} onChange={(e) => handleChangeEdicion('id_producto', e.target.value)} required>
                        {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <select value={editando.id_presentacion} onChange={(e) => handleChangeEdicion('id_presentacion', e.target.value)} required>
                        {presentaciones.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <input type="number" step="0.01" value={editando.peso_total_kg} onChange={(e) => handleChangeEdicion('peso_total_kg', e.target.value)} required />
                    <input type="number" step="0.01" value={editando.precio_por_kg} onChange={(e) => handleChangeEdicion('precio_por_kg', e.target.value)} required />
                    <span>Subtotal: ${subtotalEdicion.toLocaleString('es-CO')}</span>
                    <button type="submit">Guardar cambios</button>
                    <button type="button" onClick={handleCancelar}>Cancelar</button>
                </form>
            )}

            <TablaGenerica
                columnas={columnas}
                datos={items}
                acciones={[
                    { etiqueta: 'Editar', onClick: handleEditar },
                    { etiqueta: 'Eliminar', onClick: handleEliminar, tipo: 'peligro' }
                ]}
            />
        </div>
    );
}

export default ProductosXCompraPage;