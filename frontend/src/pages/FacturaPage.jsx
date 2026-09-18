import { useState, useEffect } from 'react';
import { getFacturas, createFactura, updateFactura, desactivarFactura } from '../services/facturaService';
import { getPersonas } from '../services/personasService';
import { getRoles } from '../services/rolService';
import { getAbonos } from '../services/abonoService';
import { getProductosXFacturaByFactura } from '../services/productosXFacturaService';
import { getProductos } from '../services/productosService';
import { getPresentaciones } from '../services/presentacionService';
import { formatMoneda } from '../utils/format';
import { generarFacturaPDF } from '../utils/facturaPdf';
import TablaGenerica from '../components/TablaGenerica';

const formVacio = { id_persona_cliente: '', fecha: '', total_pagar: '', descripcion: '', id_estado: 1 };

function FacturaPage() {
    const [items, setItems] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [todasLasPersonas, setTodasLasPersonas] = useState([]);
    const [abonos, setAbonos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [presentaciones, setPresentaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);

    const cargar = async () => {
        setCargando(true);
        const [dataItems, dataPersonas, dataRoles, dataAbonos, dataProductos, dataPresentaciones] = await Promise.all([
            getFacturas(), getPersonas(), getRoles(), getAbonos(), getProductos(), getPresentaciones()
        ]);

        const rolCliente = dataRoles.find((r) => r.nombre.toLowerCase() === 'cliente');
        const soloClientes = rolCliente
            ? dataPersonas.filter((p) => p.id_rol === rolCliente.id)
            : dataPersonas;

        setClientes(soloClientes);
        setTodasLasPersonas(dataPersonas);
        setAbonos(dataAbonos);
        setProductos(dataProductos);
        setPresentaciones(dataPresentaciones);
        setItems(dataItems);
        setCargando(false);
    };

    useEffect(() => { cargar(); }, []);

    const nombrePersona = (id) => {
        const persona = todasLasPersonas.find((p) => p.id === id);
        return persona ? `${persona.nombre} ${persona.apellido}` : `ID ${id}`;
    };

    const totalAbonado = (idFactura) => {
        return abonos
            .filter((a) => a.id_factura === idFactura)
            .reduce((acc, a) => acc + Number(a.valor), 0);
    };

    const saldoPendiente = (fila) => {
        return Math.max(Number(fila.total_pagar) - totalAbonado(fila.id), 0);
    };

    const columnas = [
        { campo: 'id', titulo: 'ID' },
        { campo: 'id_persona_cliente', titulo: 'Cliente', render: (fila) => nombrePersona(fila.id_persona_cliente) },
        { campo: 'fecha', titulo: 'Fecha' },
        { campo: 'total_pagar', titulo: 'Total', render: (fila) => formatMoneda(fila.total_pagar) },
        { campo: 'abonado', titulo: 'Abonado', render: (fila) => formatMoneda(totalAbonado(fila.id)) },
        { campo: 'pendiente', titulo: 'Pendiente', render: (fila) => formatMoneda(saldoPendiente(fila)) },
        { campo: 'descripcion', titulo: 'Descripción' }
    ];

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editandoId) {
                await updateFactura(editandoId, formData);
            } else {
                await createFactura(formData);
            }
            setFormData(formVacio);
            setEditandoId(null);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al guardar la factura.');
        }
    };

    const handleEditar = (fila) => {
        setFormData({
            id_persona_cliente: fila.id_persona_cliente,
            fecha: fila.fecha ? fila.fecha.slice(0, 16) : '',
            total_pagar: fila.total_pagar,
            descripcion: fila.descripcion || '',
            id_estado: fila.id_estado
        });
        setEditandoId(fila.id);
    };

    const handleCancelar = () => { setFormData(formVacio); setEditandoId(null); };

    const handleAnular = async (fila) => {
        try {
            await desactivarFactura(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al anular la factura.');
        }
    };

    const handleDescargarPDF = async (fila) => {
        try {
            const detalles = await getProductosXFacturaByFactura(fila.id);

            const lineas = detalles.map((d) => {
                const producto = productos.find((p) => p.id === d.id_producto);
                const presentacion = presentaciones.find((p) => p.id === d.id_presentacion);
                const nombreProducto = producto ? producto.nombre : `Producto ${d.id_producto}`;
                const nombrePresentacion = presentacion ? ` (${presentacion.nombre})` : '';
                return {
                    cantidad: d.peso_total_kg,
                    descripcion: `${nombreProducto}${nombrePresentacion}`,
                    vrUnitario: d.precio_por_kg,
                    vrTotal: d.subtotal
                };
            });

            generarFacturaPDF({
                factura: fila,
                clienteNombre: nombrePersona(fila.id_persona_cliente),
                lineas,
                totalAbonado: totalAbonado(fila.id)
            });
        } catch (err) {
            console.error(err);
            alert('Error al generar el PDF de la factura.');
        }
    };

    if (cargando) return <p>Cargando facturas...</p>;

    return (
        <div>
            <h2>Facturas (solo cabecera)</h2>
            <p style={{ color: 'var(--color-ink-soft)', marginTop: '-12px', marginBottom: '16px', fontSize: '13px' }}>
                Para registrar una factura nueva con sus productos, usa "Nueva Factura" en el menú.
            </p>
            <form onSubmit={handleSubmit}>
                <select name="id_persona_cliente" value={formData.id_persona_cliente} onChange={handleChange} required>
                    <option value="">-- Cliente --</option>
                    {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                    ))}
                </select>
                <input name="fecha" type="datetime-local" value={formData.fecha} onChange={handleChange} required />
                <input name="total_pagar" type="number" step="0.01" placeholder="Total a pagar" value={formData.total_pagar} onChange={handleChange} required />
                <input name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} />
                <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar Factura'}</button>
                {editandoId && <button type="button" onClick={handleCancelar}>Cancelar</button>}
            </form>
            <TablaGenerica
                columnas={columnas}
                datos={items}
                acciones={[
                    { etiqueta: 'PDF', onClick: handleDescargarPDF },
                    { etiqueta: 'Editar', onClick: handleEditar },
                    { etiqueta: 'Anular', onClick: handleAnular, tipo: 'peligro' }
                ]}
            />
        </div>
    );
}

export default FacturaPage;