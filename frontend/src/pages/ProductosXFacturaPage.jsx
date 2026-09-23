import { useState, useEffect } from 'react';
import { getProductosXFacturaByFactura, updateProductoXFactura, deleteProductoXFactura } from '../services/productosXFacturaService';
import { getProductos } from '../services/productosService';
import { getPresentaciones } from '../services/presentacionService';
import { getFacturas } from '../services/facturaService';
import { getPersonas } from '../services/personasService';
import { formatMoneda } from '../utils/format';
import TablaGenerica from '../components/TablaGenerica';

function ProductosXFacturaPage() {
    const [productos, setProductos] = useState([]);
    const [presentaciones, setPresentaciones] = useState([]);
    const [facturas, setFacturas] = useState([]);
    const [personas, setPersonas] = useState([]);
    const [cargandoDatos, setCargandoDatos] = useState(true);

    const [idFacturaSeleccionada, setIdFacturaSeleccionada] = useState('');
    const [lineasFactura, setLineasFactura] = useState([]);
    const [cargandoLineas, setCargandoLineas] = useState(false);
    const [editando, setEditando] = useState(null);

    const cargarDatosIniciales = async () => {
        setCargandoDatos(true);
        const [dataProductos, dataPresentaciones, dataFacturas, dataPersonas] = await Promise.all([
            getProductos(), getPresentaciones(), getFacturas(), getPersonas()
        ]);
        setProductos(dataProductos);
        setPresentaciones(dataPresentaciones);
        setFacturas(dataFacturas);
        setPersonas(dataPersonas);
        setCargandoDatos(false);
    };

    useEffect(() => { cargarDatosIniciales(); }, []);

    const nombrePersona = (id) => {
        const persona = personas.find((p) => p.id === id);
        return persona ? `${persona.nombre} ${persona.apellido}` : `ID ${id}`;
    };

    const nombreProducto = (id) => {
        const p = productos.find((prod) => prod.id === id);
        return p ? p.nombre : `ID ${id}`;
    };

    const nombrePresentacion = (id) => {
        const p = presentaciones.find((pres) => pres.id === id);
        return p ? p.nombre : `ID ${id}`;
    };

    const cargarLineas = async (idFactura) => {
        if (!idFactura) {
            setLineasFactura([]);
            return;
        }
        setCargandoLineas(true);
        const data = await getProductosXFacturaByFactura(idFactura);
        setLineasFactura(data);
        setCargandoLineas(false);
    };

    const handleSeleccionarFactura = (id) => {
        setIdFacturaSeleccionada(id);
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
            await updateProductoXFactura(editando.id, { ...editando, subtotal: subtotalEdicion });
            setEditando(null);
            cargarLineas(idFacturaSeleccionada);
        } catch (err) {
            console.error(err);
            alert('Error al guardar los cambios.');
        }
    };

    const handleEliminar = async (fila) => {
        if (!window.confirm('¿Eliminar este producto de la factura?')) return;
        try {
            await deleteProductoXFactura(fila.id);
            cargarLineas(idFacturaSeleccionada);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al eliminar.');
        }
    };

    if (cargandoDatos) return <p>Cargando datos...</p>;

    // Facturas más recientes primero, con nombre de cliente para que sea fácil ubicarla
    const facturasOrdenadas = [...facturas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return (
        <div>
            <h2>Detalle de Facturas — Correcciones</h2>
            <p style={{ color: 'var(--color-ink-soft)', marginTop: '-12px', marginBottom: '16px', fontSize: '13px' }}>
                Selecciona una factura para ver y corregir únicamente sus productos.
            </p>

            <select
                value={idFacturaSeleccionada}
                onChange={(e) => handleSeleccionarFactura(e.target.value)}
                style={{ marginBottom: '16px', maxWidth: '420px' }}
            >
                <option value="">-- Selecciona una factura --</option>
                {facturasOrdenadas.map((f) => (
                    <option key={f.id} value={f.id}>
                        #{f.id} — {nombrePersona(f.id_persona_cliente)} — {f.fecha ? f.fecha.slice(0, 10) : ''} — {formatMoneda(f.total_pagar)}
                    </option>
                ))}
            </select>

            {!idFacturaSeleccionada && (
                <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px' }}>
                    Elige una factura arriba para ver sus productos.
                </p>
            )}

            {idFacturaSeleccionada && cargandoLineas && <p>Cargando productos de la factura...</p>}

            {idFacturaSeleccionada && !cargandoLineas && (
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

                    {lineasFactura.length === 0 ? (
                        <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px' }}>Esta factura no tiene productos registrados.</p>
                    ) : (
                        <TablaGenerica
                            columnas={columnas}
                            datos={lineasFactura}
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

export default ProductosXFacturaPage;