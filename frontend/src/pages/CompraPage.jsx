import { useState, useEffect } from 'react';
import {
    getCompras, getComprasCanceladas, createCompra, updateCompra, desactivarCompra, reactivarCompra
} from '../services/compraService';
import { getProveedores } from '../services/proveedorService';
import { formatMoneda, formatFecha, aInputLocal } from '../utils/format';
import TablaGenerica from '../components/TablaGenerica';

const formVacio = { id_proveedor: '', fecha: '', total_compra: '', descripcion: '' };

function CompraPage() {
    const [items, setItems] = useState([]);
    const [anuladas, setAnuladas] = useState([]);
    const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
    const [proveedores, setProveedores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);

    const cargar = async () => {
        setCargando(true);
        const [dataItems, dataAnuladas, dataProveedores] = await Promise.all([
            getCompras(), getComprasCanceladas(), getProveedores()
        ]);
        setItems(dataItems);
        setAnuladas(dataAnuladas);
        setProveedores(dataProveedores);
        setCargando(false);
    };

    useEffect(() => { cargar(); }, []);

    const nombreProveedor = (id) => {
        const p = proveedores.find((prov) => prov.id === id);
        return p ? p.nombre : `ID ${id}`;
    };

    const columnas = [
        { campo: 'id', titulo: 'ID' },
        { campo: 'id_proveedor', titulo: 'Proveedor', render: (fila) => nombreProveedor(fila.id_proveedor) },
        { campo: 'fecha', titulo: 'Fecha', render: (fila) => formatFecha(fila.fecha) },
        { campo: 'total_compra', titulo: 'Total', render: (fila) => formatMoneda(fila.total_compra) },
        { campo: 'descripcion', titulo: 'Descripción' }
    ];

    const columnasAnuladas = [
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
            id_proveedor: fila.id_proveedor,
            fecha: aInputLocal(fila.fecha),
            total_compra: fila.total_compra,
            descripcion: fila.descripcion || ''
        });
        setEditandoId(fila.id);
    };

    const handleCancelarEdicion = () => { setFormData(formVacio); setEditandoId(null); };

    const handleAnular = async (fila) => {
        if (!window.confirm('¿Anular esta compra?')) return;
        try {
            await desactivarCompra(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al anular la compra.');
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
                    { etiqueta: 'Anular', onClick: handleAnular, tipo: 'peligro' }
                ]}
            />

            <button
                type="button"
                onClick={() => setMostrarAnuladas((prev) => !prev)}
                style={{ marginTop: '20px', background: 'transparent', color: 'var(--color-primary-dark)', border: '1px solid var(--color-primary)' }}
            >
                {mostrarAnuladas ? '▾' : '▸'} Compras anuladas ({anuladas.length})
            </button>

            {mostrarAnuladas && (
                <div style={{ marginTop: '12px' }}>
                    {anuladas.length === 0 ? (
                        <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px' }}>No hay compras anuladas.</p>
                    ) : (
                        <>
                            <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px', marginTop: 0 }}>
                                Las compras anuladas se eliminan automáticamente al cumplirse el plazo de la columna "Se elimina en". Si reactivas una, el plazo se descarta.
                            </p>
                            <TablaGenerica
                                columnas={columnasAnuladas}
                                datos={anuladas}
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