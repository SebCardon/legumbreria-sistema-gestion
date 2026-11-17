import { useState, useEffect, useRef } from 'react';
import { getProveedores } from '../services/proveedorService';
import { getProductos } from '../services/productosService';
import { getPresentaciones } from '../services/presentacionService';
import { createCompraCompleta } from '../services/compraService';
import { formatNumero } from '../utils/format';
import { subtotalLinea, sumarDinero } from '../utils/calculos';

const crearLineaVacia = () => ({
    id_producto: '', id_presentacion: '', peso_total_kg: '', precio_por_kg: ''
});

function NuevaCompraPage() {
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [presentaciones, setPresentaciones] = useState([]);
    const [cargandoDatos, setCargandoDatos] = useState(true);

    const [idProveedor, setIdProveedor] = useState('');
    const [fecha, setFecha] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [lineas, setLineas] = useState([crearLineaVacia()]);
    const [guardando, setGuardando] = useState(false);
    const enviandoRef = useRef(false);

    useEffect(() => {
        const cargarDatosIniciales = async () => {
            const [dataProveedores, dataProductos, dataPresentaciones] = await Promise.all([
                getProveedores(), getProductos(), getPresentaciones()
            ]);
            setProveedores(dataProveedores);
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
                if (campo === 'id_producto') {
                    const producto = productos.find((p) => p.id === Number(valor));
                    if (producto) actualizada.precio_por_kg = producto.costo_kg;
                }
                return actualizada;
            })
        );
    };

    const calcularSubtotal = (linea) => subtotalLinea(linea.peso_total_kg, linea.precio_por_kg);
    const totalCompra = sumarDinero(lineas.map(calcularSubtotal));

    const agregarLinea = () => setLineas((prev) => [...prev, crearLineaVacia()]);
    const eliminarLinea = (index) => {
        if (lineas.length === 1) return;
        setLineas((prev) => prev.filter((_, i) => i !== index));
    };

        const handleGuardar = async () => {
        if (enviandoRef.current) return;

        if (!idProveedor || !fecha) {
            alert('Selecciona un proveedor y una fecha.');
            return;
        }
        const lineasValidas = lineas.filter((l) => l.id_producto && l.peso_total_kg && l.id_presentacion);
        if (lineasValidas.length === 0) {
            alert('Agrega al menos un producto con cantidad.');
            return;
        }

        enviandoRef.current = true; // candado inmediato contra doble clic
        setGuardando(true);
        try {
            // Un solo envío: el servidor guarda la compra y sus productos dentro de una transacción.
            const compra = await createCompraCompleta({
                id_proveedor: idProveedor,
                fecha,
                descripcion,
                lineas: lineasValidas.map((l) => ({
                    id_producto: l.id_producto,
                    id_presentacion: l.id_presentacion,
                    peso_total_kg: l.peso_total_kg,
                    precio_por_kg: l.precio_por_kg
                }))
            });

            alert(`Compra #${compra.id} registrada. Total: $${formatNumero(compra.total_compra)}`);
            setIdProveedor('');
            setFecha('');
            setDescripcion('');
            setLineas([crearLineaVacia()]);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'No se pudo guardar la compra. Revisa tu conexión e inténtalo de nuevo.');
        } finally {
            setGuardando(false);
            enviandoRef.current = false;
        }
    };

    if (cargandoDatos) return <p>Cargando datos...</p>;

    return (
        <div>
            <h2>Nueva Compra</h2>

            <form onSubmit={(e) => e.preventDefault()}>
                <label>Proveedor: </label>
                <select value={idProveedor} onChange={(e) => setIdProveedor(e.target.value)} required>
                    <option value="">-- Selecciona un proveedor --</option>
                    {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                </select>

                <label>Fecha: </label>
                <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} required />

                <label>Observaciones: </label>
                <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" />
            </form>

            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Presentación</th>
                        <th>Cantidad (Kg)</th>
                        <th>Costo Unitario (editable)</th>
                        <th>Subtotal</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {lineas.map((linea, index) => (
                        <tr key={index}>
                            <td>
                                <select value={linea.id_producto} onChange={(e) => handleLineaChange(index, 'id_producto', e.target.value)}>
                                    <option value="">-- Producto --</option>
                                    {productos.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <select value={linea.id_presentacion} onChange={(e) => handleLineaChange(index, 'id_presentacion', e.target.value)}>
                                    <option value="">-- Presentación --</option>
                                    {presentaciones.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <input type="number" step="0.01" value={linea.peso_total_kg}
                                    onChange={(e) => handleLineaChange(index, 'peso_total_kg', e.target.value)} style={{ width: '80px' }} />
                            </td>
                            <td>
                                <input type="number" step="0.01" value={linea.precio_por_kg}
                                    onChange={(e) => handleLineaChange(index, 'precio_por_kg', e.target.value)} style={{ width: '90px' }}
                                    title="Costo sugerido del catálogo — puedes cambiarlo libremente para esta compra específica" />
                            </td>
                            <td>${formatNumero(calcularSubtotal(linea))}</td>
                            <td><button type="button" onClick={() => eliminarLinea(index)}>✕</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button type="button" onClick={agregarLinea} style={{ marginTop: '10px' }}>+ Agregar producto</button>

            <p style={{ fontSize: '12px', color: 'var(--color-ink-soft)', marginTop: '8px' }}>
                El costo de cada producto se autocompleta con el valor del catálogo, pero puedes editarlo libremente en cada línea — útil para comprar el mismo producto a precios distintos según el proveedor.
            </p>

            <h3 style={{ textAlign: 'right', marginTop: '20px' }}>
                TOTAL $ {formatNumero(totalCompra)}
            </h3>

            <button onClick={handleGuardar} disabled={guardando} style={{ padding: '10px 20px', fontSize: '16px' }}>
                {guardando ? 'Guardando...' : 'Guardar Compra'}
            </button>
        </div>
    );
}

export default NuevaCompraPage;