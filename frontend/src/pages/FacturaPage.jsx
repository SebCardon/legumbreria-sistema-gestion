import { useState, useEffect, useRef } from 'react';
import {
    getFacturas, createFactura, updateFactura, desactivarFactura,
    getFacturasCanceladas, reactivarFactura
} from '../services/facturaService';
import { getPersonas } from '../services/personasService';
import { getRoles } from '../services/rolService';
import { getAbonos, createAbono } from '../services/abonoService';
import { getProductosXFacturaByFactura } from '../services/productosXFacturaService';
import { getProductos } from '../services/productosService';
import { getPresentaciones } from '../services/presentacionService';
import { formatMoneda, ahoraLocal } from '../utils/format';
import { generarFacturaPDF } from '../utils/facturaPdf';
import TablaGenerica from '../components/TablaGenerica';
import VisorPDF from '../components/VisorPDF';

const DIAS_PAGADAS_VISIBLES = 60;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const formVacio = { id_persona_cliente: '', fecha: '', total_pagar: '', descripcion: '', id_estado: 1 };

const estiloToggle = {
    marginTop: '20px',
    background: 'transparent',
    color: 'var(--color-primary-dark)',
    border: '1px solid var(--color-primary)'
};

function FacturaPage() {
    const [items, setItems] = useState([]);       // facturas activas: por cobrar + pagadas
    const [anuladas, setAnuladas] = useState([]);
    const [mostrarPagadas, setMostrarPagadas] = useState(false);
    const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
    const [incluirAntiguas, setIncluirAntiguas] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [todasLasPersonas, setTodasLasPersonas] = useState([]);
    const [abonos, setAbonos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [presentaciones, setPresentaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [visor, setVisor] = useState(null);
    const procesandoRef = useRef(false);

    const cargar = async () => {
        setCargando(true);
        const [
            dataItems, dataAnuladas, dataPersonas, dataRoles,
            dataAbonos, dataProductos, dataPresentaciones
        ] = await Promise.all([
            getFacturas(), getFacturasCanceladas(), getPersonas(), getRoles(),
            getAbonos(), getProductos(), getPresentaciones()
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
        setAnuladas(dataAnuladas);
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

    // Pagada = tiene un total por cobrar y ya se abonó todo. Se calcula en cada momento,
    // así que si una factura pagada cambia de total, vuelve sola a "Por cobrar".
    const estaPagada = (fila) => Number(fila.total_pagar) > 0 && saldoPendiente(fila) < 0.005;

    const fechaPago = (idFactura) => {
        const fechas = abonos
            .filter((a) => a.id_factura === idFactura && a.fecha)
            .map((a) => new Date(a.fecha).getTime());
        return fechas.length > 0 ? Math.max(...fechas) : null;
    };

    const coincideBusqueda = (fila) => {
        if (!busqueda.trim()) return true;
        return nombrePersona(fila.id_persona_cliente).toLowerCase().includes(busqueda.toLowerCase());
    };

    const porCobrar = items.filter((f) => !estaPagada(f) && coincideBusqueda(f));

    const limiteVisible = Date.now() - DIAS_PAGADAS_VISIBLES * MS_POR_DIA;
    const pagadasBusqueda = items.filter((f) => estaPagada(f) && coincideBusqueda(f));
    const pagadasVisibles = pagadasBusqueda
        .filter((f) => incluirAntiguas || (fechaPago(f.id) ?? Date.now()) >= limiteVisible)
        .sort((a, b) => (fechaPago(b.id) || 0) - (fechaPago(a.id) || 0));
    const pagadasOcultas = pagadasBusqueda.length - pagadasVisibles.length;

    const columnas = [
        { campo: 'id', titulo: 'ID' },
        { campo: 'id_persona_cliente', titulo: 'Cliente', render: (fila) => nombrePersona(fila.id_persona_cliente) },
        { campo: 'fecha', titulo: 'Fecha' },
        { campo: 'total_pagar', titulo: 'Total', render: (fila) => formatMoneda(fila.total_pagar) },
        { campo: 'abonado', titulo: 'Abonado', render: (fila) => formatMoneda(totalAbonado(fila.id)) },
        { campo: 'pendiente', titulo: 'Pendiente', render: (fila) => formatMoneda(saldoPendiente(fila)) },
        { campo: 'descripcion', titulo: 'Descripción' }
    ];

    const columnasPagadas = [
        { campo: 'id', titulo: 'ID' },
        { campo: 'id_persona_cliente', titulo: 'Cliente', render: (fila) => nombrePersona(fila.id_persona_cliente) },
        { campo: 'fecha', titulo: 'Fecha' },
        { campo: 'total_pagar', titulo: 'Total', render: (fila) => formatMoneda(fila.total_pagar) },
        {
            campo: 'pagada_el',
            titulo: 'Pagada el',
            render: (fila) => {
                const t = fechaPago(fila.id);
                return t ? new Date(t).toLocaleDateString('es-CO') : '—';
            }
        },
        { campo: 'descripcion', titulo: 'Descripción' }
    ];

    const columnasAnuladas = [
        ...columnas,
        {
            campo: 'dias_restantes',
            titulo: 'Se elimina en',
            render: (fila) => fila.tiene_abonos
                ? 'Se conserva (tiene abonos)'
                : `${fila.dias_restantes} día(s)`
        }
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

    const handleCancelarEdicion = () => { setFormData(formVacio); setEditandoId(null); };

    // "Cancelar" una factura = pagarla: se registra un abono por lo que falta
    const handleCancelarSaldo = async (fila) => {
        const pendiente = saldoPendiente(fila);
        if (pendiente <= 0) {
            alert('Esta factura no tiene un saldo por cobrar.');
            return;
        }
        if (!window.confirm(`¿Registrar el pago de ${formatMoneda(pendiente)} y marcar la factura #${fila.id} como cancelada (pagada)?`)) return;

        if (procesandoRef.current) return;
        procesandoRef.current = true;
        try {
            await createAbono({
                id_persona_cliente: fila.id_persona_cliente,
                id_factura: fila.id,
                fecha: ahoraLocal(),
                valor: pendiente,
                descripcion: 'Pago del saldo restante'
            });
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al registrar el pago.');
        } finally {
            procesandoRef.current = false;
        }
    };

    // Anular = dejar sin efecto una factura hecha por error
    const handleAnular = async (fila) => {
        if (!window.confirm('¿Anular esta factura? Úsalo solo para facturas hechas por error. Si el cliente ya pagó, no la anules: usa "Cancelar saldo".')) return;
        try {
            await desactivarFactura(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al anular la factura.');
        }
    };

    const handleReactivar = async (fila) => {
        try {
            await reactivarFactura(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al reactivar la factura.');
        }
    };

    const cerrarVisor = () => {
        if (visor) URL.revokeObjectURL(visor.url);
        setVisor(null);
    };

    const handleVerPDF = async (fila) => {
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

            const { url, nombreArchivo } = generarFacturaPDF({
                factura: fila,
                clienteNombre: nombrePersona(fila.id_persona_cliente),
                lineas,
                totalAbonado: totalAbonado(fila.id)
            });
            setVisor({ url, nombreArchivo, titulo: `Factura #${fila.id}` });
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
                {editandoId && <button type="button" onClick={handleCancelarEdicion}>Cancelar edición</button>}
            </form>

            <input
                type="text"
                placeholder="Buscar por nombre de cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ marginBottom: '16px', maxWidth: '300px', display: 'block' }}
            />

            <h3 style={{ margin: '8px 0 10px 0' }}>Por cobrar ({porCobrar.length})</h3>
            {porCobrar.length === 0 ? (
                <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px' }}>No hay facturas por cobrar.</p>
            ) : (
                <TablaGenerica
                    columnas={columnas}
                    datos={porCobrar}
                    acciones={[
                        { etiqueta: 'Ver', onClick: handleVerPDF },
                        { etiqueta: 'Editar', onClick: handleEditar },
                        { etiqueta: 'Cancelar saldo', onClick: handleCancelarSaldo },
                        { etiqueta: 'Anular', onClick: handleAnular, tipo: 'peligro' }
                    ]}
                />
            )}

            {/* ---------- Canceladas = pagadas por completo ---------- */}
            <button type="button" onClick={() => setMostrarPagadas((prev) => !prev)} style={estiloToggle}>
                {mostrarPagadas ? '▾' : '▸'} Facturas canceladas (pagadas) ({pagadasVisibles.length})
            </button>

            {mostrarPagadas && (
                <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '10px' }}>
                        <input
                            type="checkbox"
                            checked={incluirAntiguas}
                            onChange={(e) => setIncluirAntiguas(e.target.checked)}
                            style={{ width: 'auto', marginRight: '6px' }}
                        />
                        Incluir las pagadas hace más de {DIAS_PAGADAS_VISIBLES} días
                        {!incluirAntiguas && pagadasOcultas > 0 && ` (${pagadasOcultas} oculta(s))`}
                    </label>

                    {pagadasVisibles.length === 0 ? (
                        <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px' }}>No hay facturas pagadas para mostrar.</p>
                    ) : (
                        <TablaGenerica
                            columnas={columnasPagadas}
                            datos={pagadasVisibles}
                            acciones={[
                                { etiqueta: 'Ver', onClick: handleVerPDF },
                                { etiqueta: 'Anular', onClick: handleAnular, tipo: 'peligro' }
                            ]}
                        />
                    )}
                </div>
            )}

            {/* ---------- Anuladas = hechas por error ---------- */}
            <br />
            <button type="button" onClick={() => setMostrarAnuladas((prev) => !prev)} style={{ ...estiloToggle, marginTop: '10px' }}>
                {mostrarAnuladas ? '▾' : '▸'} Facturas anuladas ({anuladas.length})
            </button>

            {mostrarAnuladas && (
                <div style={{ marginTop: '12px' }}>
                    {anuladas.length === 0 ? (
                        <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px' }}>No hay facturas anuladas.</p>
                    ) : (
                        <>
                            <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px', marginTop: 0 }}>
                                Las facturas anuladas sin abonos se eliminan automáticamente al cumplirse el plazo de la columna "Se elimina en". Las que tienen abonos se conservan para revisarlas. Si reactivas una, el plazo se descarta.
                            </p>
                            <TablaGenerica
                                columnas={columnasAnuladas}
                                datos={anuladas}
                                acciones={[
                                    { etiqueta: 'Ver', onClick: handleVerPDF },
                                    { etiqueta: 'Reactivar', onClick: handleReactivar }
                                ]}
                            />
                        </>
                    )}
                </div>
            )}

            {visor && (
                <VisorPDF
                    url={visor.url}
                    nombreArchivo={visor.nombreArchivo}
                    titulo={visor.titulo}
                    onCerrar={cerrarVisor}
                />
            )}
        </div>
    );
}

export default FacturaPage;