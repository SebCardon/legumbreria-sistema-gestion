import { useState, useEffect } from 'react';
import { getProveedores } from '../services/proveedorService';
import { getTransportes } from '../services/transporteService';
import { getProductos } from '../services/productosService';
import { getPresentaciones } from '../services/presentacionService';
import { createCompra } from '../services/compraService';
import { createProductoXCompra } from '../services/productosXCompraService';
import { formatNumero } from '../utils/format';

const crearLineaVacia = () => ({
    id_producto: '', id_presentacion: '', peso_total_kg: '', precio_por_kg: ''
});

function NuevaCompraPage() {
    const [proveedores, setProveedores] = useState([]);
    const [transportes, setTransportes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [presentaciones, setPresentaciones] = useState([]);
    const [cargandoDatos, setCargandoDatos] = useState(true);

    const [idProveedor, setIdProveedor] = useState('');
    const [idTransporte, setIdTransporte] = useState('');
    const [fecha, setFecha] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [lineas, setLineas] = useState([crearLineaVacia()]);
    const [guardando, setGuardando] = useState(false);

    const cargarDatosIniciales = async () => {
        const [dataProveedores, dataTransportes, dataProductos, dataPresentaciones] = await Promise.all([
            getProveedores(), getTransportes(), getProductos(), getPresentaciones()
        ]);
        setProveedores(dataProveedores);
        setTransportes(dataTransportes);
        setProductos(dataProductos);
        setPresentaciones(dataPresentaciones);
        setCargandoDatos(false);
    };

    useEffect(() => { cargarDatosIniciales(); }, []);

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

    const calcularSubtotal = (linea) => (Number(linea.peso_total_kg) || 0) * (Number(linea.precio_por_kg) || 0);
    const totalCompra = lineas.reduce((acc, l) => acc + calcularSubtotal(l), 0);

    const agregarLinea = () => setLineas((prev) => [...prev, crearLineaVacia()]);
    const eliminarLinea = (index) => {
        if (lineas.length === 1) return;
        setLineas((prev) => prev.filter((_, i) => i !== index));
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!idProveedor || !idTransporte || !fecha) {
            alert('Selecciona proveedor, transporte y fecha.');
            return;
        }
        const lineasValidas = lineas.filter((l) => l.id_producto && l.peso_total_kg && l.id_presentacion);
        if (lineasValidas.length === 0) {
            alert('Agrega al menos un producto con cantidad.');
            return;
        }

        setGuardando(true);
        try {
            const compra = await createCompra({
                id_proveedor: idProveedor,
                id_transporte: idTransporte,
                fecha,
                total_compra: totalCompra,
                descripcion
            });

            for (const linea of lineasValidas) {
                await createProductoXCompra({
                    id_compra: compra.id,
                    id_producto: linea.id_producto,
                    id_presentacion: linea.id_presentacion,
                    peso_total_kg: linea.peso_total_kg,
                    precio_por_kg: linea.precio_por_kg,
                    subtotal: calcularSubtotal(linea)
                });
            }

            alert(`Compra #${compra.id} registrada. Total: $${totalCompra.toLocaleString('es-CO')}`);
            setIdProveedor('');
            setIdTransporte('');
            setFecha('');
            setDescripcion('');
            setLineas([crearLineaVacia()]);

            // Refrescamos productos: el stock de cada uno acaba de subir
            setProductos(await getProductos());
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al guardar la compra.');
        } finally {
            setGuardando(false);
        }
    };

    if (cargandoDatos) return <p>Cargando datos...</p>;

    return (
        <div>
            <h2>Nueva Compra</h2>
            <form onSubmit={handleGuardar}>
                <label>Proveedor: </label>
                <select value={idProveedor} onChange={(e) => setIdProveedor(e.target.value)} required>
                    <option value="">-- Selecciona un proveedor --</option>
                    {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                </select>

                <label>Transporte: </label>
                <select value={idTransporte} onChange={(e) => setIdTransporte(e.target.value)} required>
                    <option value="">-- Selecciona un transporte --</option>
                    {transportes.map((t) => (
                        <option key={t.id} value={t.id}>
                            Placa {t.placa_vehiculo} — {t.valor_transporte === null ? 'valor pendiente' : `$${formatNumero(t.valor_transporte)}`}
                        </option>
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
                                    title="Precio sugerido del catálogo — puedes cambiarlo libremente para esta compra específica"/>
                            </td>
                            <td>${calcularSubtotal(linea).toLocaleString('es-CO')}</td>
                            <td><button type="button" onClick={() => eliminarLinea(index)}>✕</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button type="button" onClick={agregarLinea} style={{ marginTop: '10px' }}>+ Agregar producto</button>

            <h3 style={{ textAlign: 'right', marginTop: '20px' }}>
                TOTAL $ {formatNumero(totalCompra)}
            </h3>

            <p style={{ fontSize: '12px', color: 'var(--color-ink-soft)', marginTop: '8px' }}>
                El precio de cada producto se autocompleta con el valor del catálogo, pero puedes editarlo libremente en cada línea — útil para vender el mismo producto a precios distintos según calidad, cliente o negociación puntual.
            </p>

            <button onClick={handleGuardar} disabled={guardando} style={{ padding: '10px 20px', fontSize: '16px' }}>
                {guardando ? 'Guardando...' : 'Guardar Compra'}
            </button>
        </div>
    );
}

export default NuevaCompraPage;