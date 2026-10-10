import { useState, useEffect, useRef } from 'react';
import { getCatalogoProductos } from '../services/productosService';
import { getCategorias } from '../services/categoriaService';
import { getPresentaciones } from '../services/presentacionService';
import { getPersonas } from '../services/personasService';
import { getRoles } from '../services/rolService';
import { createFactura } from '../services/facturaService';
import { createProductoXFactura } from '../services/productosXFacturaService';
import { createAbono } from '../services/abonoService';
import { formatMoneda, ahoraLocal } from '../utils/format';
import { generarFacturaPDF } from '../utils/facturaPdf';
import VisorPDF from '../components/VisorPDF';

function NuevaFacturaPage() {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [presentaciones, setPresentaciones] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cargandoDatos, setCargandoDatos] = useState(true);

    const [busqueda, setBusqueda] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

    const [idPersonaCliente, setIdPersonaCliente] = useState('');
    const [fecha, setFecha] = useState(ahoraLocal());
    const [descripcion, setDescripcion] = useState('');
    const [pagoCompleto, setPagoCompleto] = useState(false);
    const [lineas, setLineas] = useState([]);
    const [guardando, setGuardando] = useState(false);
    const [visor, setVisor] = useState(null);

    const enviandoRef = useRef(false);
    const contadorRef = useRef(0);
    const enfocarUidRef = useRef(null);

    useEffect(() => {
        const cargar = async () => {
            const [dataProductos, dataCategorias, dataPresentaciones, dataPersonas, dataRoles] = await Promise.all([
                getCatalogoProductos(), getCategorias(), getPresentaciones(), getPersonas(), getRoles()
            ]);
            const rolCliente = dataRoles.find((r) => r.nombre.toLowerCase() === 'cliente');
            const soloClientes = rolCliente
                ? dataPersonas.filter((p) => p.id_rol === rolCliente.id)
                : dataPersonas;

            setProductos(dataProductos);
            setCategorias(dataCategorias);
            setPresentaciones(dataPresentaciones);
            setClientes(soloClientes);
            setCargandoDatos(false);
        };
        cargar();
    }, []);

    const presentacionPorDefecto =
        presentaciones.find((p) => p.nombre.toLowerCase().includes('kilo')) || presentaciones[0];

    const nombreProducto = (id) => {
        const p = productos.find((prod) => prod.id === id);
        return p ? p.nombre : `Producto ${id}`;
    };

    const cerrarVisor = () => {
        if (visor) URL.revokeObjectURL(visor.url);
        setVisor(null);
    };

    const agregarProducto = (producto) => {
        const uid = ++contadorRef.current;
        enfocarUidRef.current = uid; // el campo de cantidad de esta línea recibe el cursor
        setLineas((prev) => [...prev, {
            uid,
            id_producto: producto.id,
            id_presentacion: presentacionPorDefecto ? presentacionPorDefecto.id : '',
            peso_total_kg: '',
            precio_por_kg: producto.precio_venta_kg
        }]);
    };

    const actualizarLinea = (uid, campo, valor) => {
        setLineas((prev) => prev.map((l) => (l.uid === uid ? { ...l, [campo]: valor } : l)));
    };

    const quitarLinea = (uid) => {
        setLineas((prev) => prev.filter((l) => l.uid !== uid));
    };

    const calcularSubtotal = (linea) =>
        (Number(linea.peso_total_kg) || 0) * (Number(linea.precio_por_kg) || 0);

    const totalFactura = lineas.reduce((acc, l) => acc + calcularSubtotal(l), 0);

    const lineasPorProducto = lineas.reduce((mapa, l) => {
        mapa[l.id_producto] = (mapa[l.id_producto] || 0) + 1;
        return mapa;
    }, {});

    const productosFiltrados = productos.filter((p) => {
        const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase().trim());
        const coincideCategoria = categoriaFiltro === 'todas' || p.id_categoria === Number(categoriaFiltro);
        return coincideNombre && coincideCategoria;
    });

    const handleGuardar = async () => {
        if (enviandoRef.current) return;

        if (!idPersonaCliente || !fecha) {
            alert('Selecciona un cliente y una fecha.');
            return;
        }
        if (lineas.length === 0) {
            alert('Agrega al menos un producto.');
            return;
        }
        if (lineas.some((l) => !(Number(l.peso_total_kg) > 0) || !l.id_presentacion)) {
            alert('Hay productos sin cantidad o sin presentación. Complétalos o quítalos de la factura.');
            return;
        }

        enviandoRef.current = true; // candado inmediato contra doble clic
        setGuardando(true);
        try {
            const factura = await createFactura({
                id_persona_cliente: idPersonaCliente,
                fecha,
                total_pagar: totalFactura,
                descripcion,
                id_estado: 1
            });

            for (const linea of lineas) {
                await createProductoXFactura({
                    id_factura: factura.id,
                    id_producto: linea.id_producto,
                    id_presentacion: linea.id_presentacion,
                    peso_total_kg: linea.peso_total_kg,
                    precio_por_kg: linea.precio_por_kg,
                    subtotal: calcularSubtotal(linea)
                });
            }

            // Venta de contado: se registra el pago completo. Va aparte para que, si fallara,
            // no parezca que la factura no se guardó.
            let pagoRegistrado = false;
            if (pagoCompleto && totalFactura > 0) {
                try {
                    await createAbono({
                        id_persona_cliente: idPersonaCliente,
                        id_factura: factura.id,
                        fecha,
                        valor: totalFactura,
                        descripcion: 'Pago de contado'
                    });
                    pagoRegistrado = true;
                } catch (errAbono) {
                    console.error(errAbono);
                    alert(`La factura #${factura.id} se guardó, pero no se pudo registrar el pago. Regístralo desde "Facturas" con "Cancelar saldo".`);
                }
            }

            // Se muestra la factura de inmediato, también en su propio try/catch
            try {
                const cliente = clientes.find((c) => c.id === Number(idPersonaCliente));
                const lineasPdf = lineas.map((l) => {
                    const presentacion = presentaciones.find((p) => p.id === Number(l.id_presentacion));
                    return {
                        cantidad: l.peso_total_kg,
                        descripcion: `${nombreProducto(l.id_producto)}${presentacion ? ` (${presentacion.nombre})` : ''}`,
                        vrUnitario: l.precio_por_kg,
                        vrTotal: calcularSubtotal(l)
                    };
                });
                const { url, nombreArchivo } = generarFacturaPDF({
                    factura,
                    clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : '',
                    lineas: lineasPdf,
                    totalAbonado: pagoRegistrado ? totalFactura : 0
                });
                setVisor({ url, nombreArchivo, titulo: `Factura #${factura.id} creada` });
            } catch (errPdf) {
                console.error(errPdf);
                alert(`La factura #${factura.id} se guardó, pero no se pudo mostrar el PDF. La encuentras en "Facturas".`);
            }

            setIdPersonaCliente('');
            setFecha(ahoraLocal());
            setDescripcion('');
            setPagoCompleto(false);
            setLineas([]);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al guardar la factura.');
        } finally {
            setGuardando(false);
            enviandoRef.current = false;
        }
    };

    if (cargandoDatos) return <p>Cargando catálogo...</p>;

    return (
        <div>
            <h2>Nueva Factura</h2>

            <div className="pos-layout">
                {/* ---------- Catálogo ---------- */}
                <section className="pos-catalogo">
                    <input
                        className="pos-busqueda"
                        type="text"
                        placeholder="Buscar producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />

                    <div className="pos-filtros">
                        <button
                            className={`pos-chip ${categoriaFiltro === 'todas' ? 'activo' : ''}`}
                            onClick={() => setCategoriaFiltro('todas')}
                        >
                            Todos
                        </button>
                        {categorias.map((c) => (
                            <button
                                key={c.id}
                                className={`pos-chip ${categoriaFiltro === String(c.id) ? 'activo' : ''}`}
                                onClick={() => setCategoriaFiltro(String(c.id))}
                            >
                                {c.nombre}
                            </button>
                        ))}
                    </div>

                    {productosFiltrados.length === 0 ? (
                        <p className="pos-vacio">No hay productos que coincidan con la búsqueda.</p>
                    ) : (
                        <div className="pos-grid">
                            {productosFiltrados.map((p) => (
                                <button key={p.id} className="pos-tile" onClick={() => agregarProducto(p)}>
                                    {p.imagen ? (
                                        <img className="pos-tile-img" src={p.imagen} alt={p.nombre} />
                                    ) : (
                                        <span className="pos-tile-placeholder">{p.nombre.charAt(0).toUpperCase()}</span>
                                    )}
                                    {lineasPorProducto[p.id] > 0 && (
                                        <span className="pos-tile-badge">{lineasPorProducto[p.id]}</span>
                                    )}
                                    <span className="pos-tile-info">
                                        <span className="pos-tile-nombre">{p.nombre}</span>
                                        <span className="pos-tile-precio">{formatMoneda(p.precio_venta_kg)} / kg</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* ---------- Panel de la factura ---------- */}
                <aside className="pos-panel">
                    <h3>Factura</h3>

                    <div className="pos-campo">
                        <label>Cliente</label>
                        <select value={idPersonaCliente} onChange={(e) => setIdPersonaCliente(e.target.value)}>
                            <option value="">-- Selecciona un cliente --</option>
                            {clientes.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pos-campo">
                        <label>Fecha</label>
                        <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                    </div>

                    <div className="pos-campo">
                        <label>Observaciones</label>
                        <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" />
                    </div>

                    <div className="pos-lineas">
                        {lineas.length === 0 && (
                            <p className="pos-vacio">Toca un producto del catálogo para agregarlo.</p>
                        )}

                        {lineas.map((linea) => (
                            <div key={linea.uid} className="pos-linea">
                                <div className="pos-linea-cabecera">
                                    <span className="pos-linea-nombre">{nombreProducto(linea.id_producto)}</span>
                                    <button className="pos-quitar" onClick={() => quitarLinea(linea.uid)} title="Quitar">✕</button>
                                </div>
                                <div className="pos-linea-fila">
                                    <select
                                        value={linea.id_presentacion}
                                        onChange={(e) => actualizarLinea(linea.uid, 'id_presentacion', e.target.value)}
                                    >
                                        {presentaciones.map((p) => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                    <input
                                        className="pos-in-cant"
                                        type="number"
                                        step="0.01"
                                        placeholder="Kg"
                                        value={linea.peso_total_kg}
                                        onChange={(e) => actualizarLinea(linea.uid, 'peso_total_kg', e.target.value)}
                                        ref={(el) => {
                                            if (el && enfocarUidRef.current === linea.uid) {
                                                el.focus();
                                                enfocarUidRef.current = null;
                                            }
                                        }}
                                    />
                                    <span className="pos-por">kg ×</span>
                                    <input
                                        className="pos-in-precio"
                                        type="number"
                                        step="0.01"
                                        placeholder="$/kg"
                                        title="Precio sugerido del catálogo. Puedes cambiarlo libremente para esta venta."
                                        value={linea.precio_por_kg}
                                        onChange={(e) => actualizarLinea(linea.uid, 'precio_por_kg', e.target.value)}
                                    />
                                </div>
                                <div className="pos-linea-subtotal">{formatMoneda(calcularSubtotal(linea))}</div>
                            </div>
                        ))}
                    </div>

                    <label className="pos-pago">
                        <input
                            type="checkbox"
                            checked={pagoCompleto}
                            onChange={(e) => setPagoCompleto(e.target.checked)}
                        />
                        Pagó completo (venta de contado)
                    </label>

                    <div className="pos-total">
                        <span>TOTAL</span>
                        <span>{formatMoneda(totalFactura)}</span>
                    </div>

                    <button className="pos-guardar" onClick={handleGuardar} disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar factura'}
                    </button>
                </aside>
            </div>

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

export default NuevaFacturaPage;