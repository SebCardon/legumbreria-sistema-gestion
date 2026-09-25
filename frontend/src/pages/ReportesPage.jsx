import { useState, useEffect } from 'react';
import { getCompras } from '../services/compraService';
import { getFacturas } from '../services/facturaService';
import { getProductosXCompra } from '../services/productosXCompraService';
import { getProductosXFactura } from '../services/productosXFacturaService';
import { getProductos } from '../services/productosService';
import { formatMoneda, formatNumero } from '../utils/format';
import { generarReportePDF } from '../utils/reportePdf';

const OPCIONES_PERIODO = [
    { key: 'hoy', label: 'Hoy' },
    { key: 'semana', label: 'Esta semana' },
    { key: 'mes', label: 'Este mes' }
];

function calcularRango(periodo) {
    const ahora = new Date();
    let inicio;
    const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);

    if (periodo === 'hoy') {
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
    } else if (periodo === 'semana') {
        const diaSemana = ahora.getDay();
        const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1;
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diffLunes, 0, 0, 0);
    } else {
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);
    }
    return { inicio, fin };
}

function ReportesPage() {
    const [compras, setCompras] = useState([]);
    const [facturas, setFacturas] = useState([]);
    const [lineasCompra, setLineasCompra] = useState([]);
    const [lineasFactura, setLineasFactura] = useState([]);
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [periodo, setPeriodo] = useState('hoy');

    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            const [dataCompras, dataFacturas, dataLineasCompra, dataLineasFactura, dataProductos] = await Promise.all([
                getCompras(), getFacturas(), getProductosXCompra(), getProductosXFactura(), getProductos()
            ]);
            setCompras(dataCompras);
            setFacturas(dataFacturas);
            setLineasCompra(dataLineasCompra);
            setLineasFactura(dataLineasFactura);
            setProductos(dataProductos);
            setCargando(false);
        };
        cargar();
    }, []);

    if (cargando) return <p>Cargando reporte...</p>;

    const { inicio, fin } = calcularRango(periodo);

    const compraDentroDelRango = (idCompra) => {
        const compra = compras.find((c) => c.id === idCompra);
        if (!compra || !compra.fecha) return false;
        const fecha = new Date(compra.fecha);
        return fecha >= inicio && fecha <= fin;
    };

    const facturaDentroDelRango = (idFactura) => {
        const factura = facturas.find((f) => f.id === idFactura);
        if (!factura || !factura.fecha) return false;
        const fecha = new Date(factura.fecha);
        return fecha >= inicio && fecha <= fin;
    };

    const lineasCompraFiltradas = lineasCompra.filter((l) => compraDentroDelRango(l.id_compra));
    const lineasFacturaFiltradas = lineasFactura.filter((l) => facturaDentroDelRango(l.id_factura));

    const mapa = new Map();
    const asegurarEntrada = (idProducto) => {
        if (!mapa.has(idProducto)) {
            mapa.set(idProducto, { kgEntrada: 0, kgSalida: 0, valorEntrada: 0, valorSalida: 0 });
        }
        return mapa.get(idProducto);
    };

    lineasCompraFiltradas.forEach((l) => {
        const entrada = asegurarEntrada(l.id_producto);
        entrada.kgEntrada += Number(l.peso_total_kg);
        entrada.valorEntrada += Number(l.subtotal);
    });
    lineasFacturaFiltradas.forEach((l) => {
        const entrada = asegurarEntrada(l.id_producto);
        entrada.kgSalida += Number(l.peso_total_kg);
        entrada.valorSalida += Number(l.subtotal);
    });

    const nombreProducto = (id) => {
        const p = productos.find((prod) => prod.id === id);
        return p ? p.nombre : `Producto ${id}`;
    };

    const filas = Array.from(mapa.entries())
        .map(([idProducto, datos]) => ({
            producto: nombreProducto(idProducto),
            kgEntrada: datos.kgEntrada,
            kgSalida: datos.kgSalida,
            valorEntrada: datos.valorEntrada,
            valorSalida: datos.valorSalida
        }))
        .sort((a, b) => a.producto.localeCompare(b.producto));

    const totalEntradaValor = filas.reduce((acc, f) => acc + f.valorEntrada, 0);
    const totalSalidaValor = filas.reduce((acc, f) => acc + f.valorSalida, 0);
    const totalEntradaKg = filas.reduce((acc, f) => acc + f.kgEntrada, 0);
    const totalSalidaKg = filas.reduce((acc, f) => acc + f.kgSalida, 0);

    const periodoLabel = OPCIONES_PERIODO.find((o) => o.key === periodo)?.label || periodo;

    const handleDescargarPDF = () => {
        generarReportePDF({
            periodoLabel,
            resumen: { totalEntradaValor, totalSalidaValor, totalEntradaKg, totalSalidaKg },
            filas
        });
    };

    return (
        <div>
            <h2>Reportes — Entradas y Salidas</h2>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: '13px', marginTop: '-12px', marginBottom: '20px', maxWidth: '640px' }}>
                Este reporte muestra únicamente las compras y facturas <strong>registradas en el sistema</strong>.
                No es un balance financiero completo del negocio — ventas informales sin factura no quedan reflejadas aquí.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {OPCIONES_PERIODO.map((op) => (
                    <button
                        key={op.key}
                        onClick={() => setPeriodo(op.key)}
                        className={op.key === periodo ? '' : 'btn-secundario'}
                    >
                        {op.label}
                    </button>
                ))}
                <button onClick={handleDescargarPDF} className="btn-secundario" style={{ marginLeft: 'auto' }}>
                    Descargar PDF
                </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 1, background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '4px', padding: '14px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-soft)', margin: '0 0 6px 0' }}>Entradas (compras registradas)</p>
                    <p style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{formatMoneda(totalEntradaValor)}</p>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-soft)', margin: '4px 0 0 0' }}>{formatNumero(totalEntradaKg)} kg</p>
                </div>
                <div style={{ flex: 1, background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '4px', padding: '14px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-soft)', margin: '0 0 6px 0' }}>Salidas (facturas registradas)</p>
                    <p style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{formatMoneda(totalSalidaValor)}</p>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-soft)', margin: '4px 0 0 0' }}>{formatNumero(totalSalidaKg)} kg</p>
                </div>
            </div>

            {filas.length === 0 ? (
                <p style={{ color: 'var(--color-ink-soft)' }}>No hay movimientos registrados en este periodo.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Kg entraron</th>
                            <th>Kg salieron</th>
                            <th>$ entrada</th>
                            <th>$ salida</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((fila) => (
                            <tr key={fila.producto}>
                                <td>{fila.producto}</td>
                                <td>{formatNumero(fila.kgEntrada)}</td>
                                <td>{formatNumero(fila.kgSalida)}</td>
                                <td>{formatMoneda(fila.valorEntrada)}</td>
                                <td>{formatMoneda(fila.valorSalida)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ReportesPage;