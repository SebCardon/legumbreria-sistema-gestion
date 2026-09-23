import { useState, useEffect, useRef } from 'react';
import { getPersonas } from '../services/personasService';
import { getProductos } from '../services/productosService';
import { getPresentaciones } from '../services/presentacionService';
import { createFactura } from '../services/facturaService';
import { createProductoXFactura } from '../services/productosXFacturaService';
import { formatNumero } from '../utils/format';

const crearLineaVacia = () => ({
    id_producto: '',
    id_presentacion: '',
    peso_total_kg: '',
    precio_por_kg: ''
});

function NuevaFacturaPage() {
    const [personas, setPersonas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [presentaciones, setPresentaciones] = useState([]);
    const [cargandoDatos, setCargandoDatos] = useState(true);

    const [idPersonaCliente, setIdPersonaCliente] = useState('');
    const [fecha, setFecha] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [lineas, setLineas] = useState([crearLineaVacia()]);
    const [guardando, setGuardando] = useState(false);
    const enviandoRef = useRef(false);

    useEffect(() => {
        const cargarDatosIniciales = async () => {
            const [dataPersonas, dataProductos, dataPresentaciones] = await Promise.all([
                getPersonas(),
                getProductos(),
                getPresentaciones()
            ]);
            setPersonas(dataPersonas);
            setProductos(dataProductos);
            setPresentaciones(dataPresentaciones);
            setCargandoDatos(false);
        };
        cargarDatosIniciales();
    }, []);

    const handleLineaChange = (index, campo, valor) => {
        setLineas((prev) =>
            prev.map((linea, i) => {
                if (i !== index) return linea;
                const actualizada = { ...linea, [campo]: valor };
                // Al elegir un producto, autocompletamos su precio de venta (el usuario aún puede ajustarlo)
                if (campo === 'id_producto') {
                    const producto = productos.find((p) => p.id === Number(valor));
                    if (producto) actualizada.precio_por_kg = producto.precio_venta_kg;
                }
                return actualizada;
            })
        );
    };

    const calcularSubtotal = (linea) => {
        const cantidad = Number(linea.peso_total_kg) || 0;
        const precio = Number(linea.precio_por_kg) || 0;
        return cantidad * precio;
    };

    const totalFactura = lineas.reduce((acumulado, linea) => acumulado + calcularSubtotal(linea), 0);

    const agregarLinea = () => setLineas((prev) => [...prev, crearLineaVacia()]);

    const eliminarLinea = (index) => {
        if (lineas.length === 1) return; // siempre debe quedar al menos una fila
        setLineas((prev) => prev.filter((_, i) => i !== index));
    };

    const handleGuardar = async (e) => {
    e.preventDefault();
    if (enviandoRef.current) return; // ya hay un guardado en curso, ignora el clic extra
    enviandoRef.current = true;

    if (!idPersonaCliente || !fecha) {
        alert('Selecciona un cliente y una fecha.');
        enviandoRef.current = false;
        return;
    }

    const lineasValidas = lineas.filter((l) => l.id_producto && l.peso_total_kg && l.id_presentacion);
    if (lineasValidas.length === 0) {
        alert('Agrega al menos un producto con cantidad.');
        enviandoRef.current = false;
        return;
    }

    setGuardando(true);
    try {
        // 1. Creamos la cabecera de la factura, con el total ya calculado
        const factura = await createFactura({
            id_persona_cliente: idPersonaCliente,
            fecha,
            total_pagar: totalFactura,
            descripcion,
            id_estado: 1
        });

        // 2. Creamos cada línea (producto vendido), una por una y en orden.
        for (const linea of lineasValidas) {
            await createProductoXFactura({
                id_factura: factura.id,
                id_producto: linea.id_producto,
                id_presentacion: linea.id_presentacion,
                peso_total_kg: linea.peso_total_kg,
                precio_por_kg: linea.precio_por_kg,
                subtotal: calcularSubtotal(linea)
            });
        }

        alert(`Factura #${factura.id} creada correctamente. Total: $${totalFactura.toLocaleString('es-CO')}`);

        // Reset del formulario
        setIdPersonaCliente('');
        setFecha('');
        setDescripcion('');
        setLineas([crearLineaVacia()]);
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || 'Error al guardar la factura.');
    } finally {
        setGuardando(false);
        enviandoRef.current = false; // libera el candado, ya sea que salió bien o mal
    }
};

    if (cargandoDatos) return <p>Cargando datos...</p>;

    return (
        <div>
            <h2>Nueva Factura</h2>

            <form onSubmit={handleGuardar}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Cliente: </label>
                    <select value={idPersonaCliente} onChange={(e) => setIdPersonaCliente(e.target.value)} required>
                        <option value="">-- Selecciona un cliente --</option>
                        {personas.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} {p.apellido} ({p.num_documento})
                            </option>
                        ))}
                    </select>

                    <label style={{ marginLeft: '15px' }}>Fecha: </label>
                    <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} required />

                    <label style={{ marginLeft: '15px' }}>Observaciones: </label>
                    <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" />
                </div>

                <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Descripción (Producto)</th>
                            <th>Presentación</th>
                            <th>Cantidad (Kg)</th>
                            <th>Vr. Unitario (editable)</th>
                            <th>Vr. Total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {lineas.map((linea, index) => (
                            <tr key={index}>
                                <td>
                                    <select
                                        value={linea.id_producto}
                                        onChange={(e) => handleLineaChange(index, 'id_producto', e.target.value)}
                                    >
                                        <option value="">-- Producto --</option>
                                        {productos.map((p) => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <select
                                        value={linea.id_presentacion}
                                        onChange={(e) => handleLineaChange(index, 'id_presentacion', e.target.value)}
                                    >
                                        <option value="">-- Presentación --</option>
                                        {presentaciones.map((p) => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={linea.peso_total_kg}
                                        onChange={(e) => handleLineaChange(index, 'peso_total_kg', e.target.value)}
                                        style={{ width: '80px' }}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={linea.precio_por_kg}
                                        onChange={(e) => handleLineaChange(index, 'precio_por_kg', e.target.value)}
                                        style={{ width: '90px' }}
                                        title="Precio sugerido del catálogo — puedes cambiarlo libremente para esta venta específica"
                                    />
                                </td>
                                <td>${calcularSubtotal(linea).toLocaleString('es-CO')}</td>
                                <td>
                                    <button type="button" onClick={() => eliminarLinea(index)}>✕</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button type="button" onClick={agregarLinea} style={{ marginTop: '10px' }}>
                    + Agregar producto
                </button>

                <h3 style={{ textAlign: 'right', marginTop: '20px' }}>
                    TOTAL $ {formatNumero(totalFactura)}
                </h3>

                <p style={{ fontSize: '12px', color: 'var(--color-ink-soft)', marginTop: '8px' }}>
                    El precio de cada producto se autocompleta con el valor del catálogo, pero puedes editarlo libremente en cada línea — útil para vender el mismo producto a precios distintos según calidad, cliente o negociación puntual.
                </p>

                <button type="submit" disabled={guardando} style={{ padding: '10px 20px', fontSize: '16px' }}>
                    {guardando ? 'Guardando...' : 'Guardar Factura'}
                </button>
            </form>
        </div>
    );
}

export default NuevaFacturaPage;