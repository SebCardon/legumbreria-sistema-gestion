import { useState, useEffect } from 'react';
import {
    getCompras, getComprasCanceladas, createCompra, updateCompra, desactivarCompra, reactivarCompra
} from '../services/compraService';
import { getProveedores } from '../services/proveedorService';
import { getTransportes } from '../services/transporteService';
import { formatMoneda } from '../utils/format';
import TablaGenerica from '../components/TablaGenerica';

const formVacio = { id_proveedor: '', id_transporte: '', fecha: '', total_compra: '', descripcion: '' };

function CompraPage() {
    const [items, setItems] = useState([]);
    const [canceladas, setCanceladas] = useState([]);
    const [mostrarCanceladas, setMostrarCanceladas] = useState(false);
    const [proveedores, setProveedores] = useState([]);
    const [transportes, setTransportes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);

    const cargar = async () => {
        setCargando(true);
        const [dataItems, dataCanceladas, dataProveedores, dataTransportes] = await Promise.all([
            getCompras(), getComprasCanceladas(), getProveedores(), getTransportes()
        ]);
        setItems(dataItems);
        setCanceladas(dataCanceladas);
        setProveedores(dataProveedores);
        setTransportes(dataTransportes);
        setCargando(false);
    };

    useEffect(() => { cargar(); }, []);

    const nombreProveedor = (id) => {
        const p = proveedores.find((prov) => prov.id === id);
        return p ? p.nombre : `ID ${id}`;
    };

    const referenciaTransporte = (id) => {
        const t = transportes.find((tr) => tr.id === id);
        return t ? `Placa ${t.placa_vehiculo}` : `ID ${id}`;
    };

    const columnas = [
        { campo: 'id', titulo: 'ID' },
        { campo: 'id_proveedor', titulo: 'Proveedor', render: (fila) => nombreProveedor(fila.id_proveedor) },
        { campo: 'id_transporte', titulo: 'Transporte', render: (fila) => referenciaTransporte(fila.id_transporte) },
        { campo: 'fecha', titulo: 'Fecha' },
        { campo: 'total_compra', titulo: 'Total', render: (fila) => formatMoneda(fila.total_compra) },
        { campo: 'descripcion', titulo: 'Descripción' }
    ];

    const columnasCanceladas = [
        ...columnas,
        { campo: 'dias_restantes', titulo: 'Se elimina en', render: (fila) => `${fila.dias_restantes} día(s)` }
    ];

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editandoId) {
                await updateCompra(editandoId, formData);
            } else {
                await createCompra(formData);
            }
            setFormData(formVacio);
            setEditandoId(null);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al guardar la compra.');
        }
    };

    const handleEditar = (fila) => {
        setFormData({
            id_proveedor: fila.id_proveedor, id_transporte: fila.id_transporte,
            fecha: fila.fecha ? fila.fecha.slice(0, 16) : '',
            total_compra: fila.total_compra, descripcion: fila.descripcion || ''
        });
        setEditandoId(fila.id);
    };

    const handleCancelarEdicion = () => { setFormData(formVacio); setEditandoId(null); };

    const handleCancelarCompra = async (fila) => {
        if (!window.confirm('¿Marcar esta compra como cancelada?')) return;
        try {
            await desactivarCompra(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al cancelar la compra.');
        }
    };

    const handleReactivar = async (fila) => {
        try {
            await reactivarCompra(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al reactivar la compra.');
        }
    };

    if (cargando) return <p>Cargando compras...</p>;

    return (
        <div>
            <h2>Compras (solo cabecera)</h2>
            <p style={{ color: 'var(--color-ink-soft)', marginTop: '-12px', marginBottom: '16px', fontSize: '13px' }}>
                Para registrar una compra nueva con sus productos, usa "Nueva Compra" en el menú.
            </p>
            <form onSubmit={handleSubmit}>
                <select name="id_proveedor" value={formData.id_proveedor} onChange={handleChange} required>
                    <option value="">-- Proveedor --</option>
                    {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                </select>
                <select name="id_transporte" value={formData.id_transporte} onChange={handleChange} required>
                    <option value="">-- Transporte --</option>
                    {transportes.map((t) => (
                        <option key={t.id} value={t.id}>Placa {t.placa_vehiculo}</option>
                    ))}
                </select>
                <input name="fecha" type="datetime-local" value={formData.fecha} onChange={handleChange} required />
                <input name="total_compra" type="number" step="0.01" placeholder="Total" value={formData.total_compra} onChange={handleChange} required />
                <input name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} />
                <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar Compra'}</button>
                {editandoId && <button type="button" onClick={handleCancelarEdicion}>Cancelar edición</button>}
            </form>

            <TablaGenerica
                columnas={columnas}
                datos={items}
                acciones={[
                    { etiqueta: 'Editar', onClick: handleEditar },
                    { etiqueta: 'Cancelar', onClick: handleCancelarCompra, tipo: 'peligro' }
                ]}
            />

            <button
                type="button"
                onClick={() => setMostrarCanceladas((prev) => !prev)}
                style={{ marginTop: '20px', background: 'transparent', color: 'var(--color-primary-dark)', border: '1px solid var(--color-primary)' }}
            >
                {mostrarCanceladas ? '▾' : '▸'} Compras canceladas ({canceladas.length})
            </button>

            {mostrarCanceladas && (
                <div style={{ marginTop: '12px' }}>
                    {canceladas.length === 0 ? (
                        <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px' }}>No hay compras canceladas.</p>
                    ) : (
                        <>
                            <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px', marginTop: 0 }}>
                                Las compras canceladas se eliminan automáticamente al cumplirse el plazo de la columna "Se elimina en". Si reactivas una, el plazo se descarta.
                            </p>
                            <TablaGenerica
                                columnas={columnasCanceladas}
                                datos={canceladas}
                                acciones={[{ etiqueta: 'Reactivar', onClick: handleReactivar }]}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default CompraPage;