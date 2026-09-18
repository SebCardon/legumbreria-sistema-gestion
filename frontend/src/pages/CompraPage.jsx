import { useState, useEffect } from 'react';
import { getCompras, createCompra, updateCompra, deleteCompra } from '../services/compraService';
import { getProveedores } from '../services/proveedorService';
import { getTransportes } from '../services/transporteService';
import TablaGenerica from '../components/TablaGenerica';
import { formatMoneda } from '../utils/format';

const formVacio = { id_proveedor: '', id_transporte: '', fecha: '', total_compra: '', descripcion: '' };

function CompraPage() {
    const [items, setItems] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [transportes, setTransportes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);

    const cargar = async () => {
        setCargando(true);
        const [dataItems, dataProveedores, dataTransportes] = await Promise.all([
            getCompras(), getProveedores(), getTransportes()
        ]);
        setItems(dataItems);
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

    const handleCancelar = () => { setFormData(formVacio); setEditandoId(null); };

    const handleEliminar = async (fila) => {
        if (!window.confirm('¿Eliminar esta compra?')) return;
        try {
            await deleteCompra(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al eliminar.');
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
                {editandoId && <button type="button" onClick={handleCancelar}>Cancelar</button>}
            </form>
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

export default CompraPage;