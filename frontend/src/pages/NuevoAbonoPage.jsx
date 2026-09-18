import { useState, useEffect } from 'react';
import { getPersonas } from '../services/personasService';
import { getRoles } from '../services/rolService';
import { getFacturas } from '../services/facturaService';
import { getResumenFactura, createAbono, aplicarSaldoAFavor } from '../services/abonoService';
import { formatMoneda } from '../utils/format';

function NuevoAbonoPage() {
    const [clientes, setClientes] = useState([]);
    const [facturas, setFacturas] = useState([]);
    const [cargandoDatos, setCargandoDatos] = useState(true);

    const [idCliente, setIdCliente] = useState('');
    const [idFactura, setIdFactura] = useState('');
    const [resumen, setResumen] = useState(null);
    const [valorAbono, setValorAbono] = useState('');
    const [fecha, setFecha] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [guardando, setGuardando] = useState(false);

    const cargarDatosIniciales = async () => {
        const [dataPersonas, dataRoles, dataFacturas] = await Promise.all([
            getPersonas(), getRoles(), getFacturas()
        ]);
        const rolCliente = dataRoles.find((r) => r.nombre.toLowerCase() === 'cliente');
        const soloClientes = rolCliente ? dataPersonas.filter((p) => p.id_rol === rolCliente.id) : dataPersonas;
        setClientes(soloClientes);
        setFacturas(dataFacturas);
        setCargandoDatos(false);
    };

    useEffect(() => { cargarDatosIniciales(); }, []);

    const clienteSeleccionado = clientes.find((c) => c.id === Number(idCliente));
    const facturasDelCliente = facturas.filter((f) => f.id_persona_cliente === Number(idCliente));

    const handleSeleccionarFactura = async (id) => {
        setIdFactura(id);
        setResumen(null);
        if (!id) return;
        const data = await getResumenFactura(id);
        setResumen(data);
    };

    const handleSeleccionarCliente = (id) => {
        setIdCliente(id);
        setIdFactura('');
        setResumen(null);
    };

    const refrescarTodo = async () => {
        await cargarDatosIniciales();
        if (idFactura) {
            const data = await getResumenFactura(idFactura);
            setResumen(data);
        }
    };

    const handleGuardarAbono = async (e) => {
        e.preventDefault();
        if (!idCliente || !idFactura || !fecha || !valorAbono) {
            alert('Completa cliente, factura, fecha y valor del abono.');
            return;
        }
        setGuardando(true);
        try {
            const resultado = await createAbono({
                id_persona_cliente: idCliente,
                id_factura: idFactura,
                fecha,
                valor: valorAbono,
                descripcion
            });

            let mensaje = `Abono registrado. Aplicado a la factura: ${formatMoneda(resultado.monto_aplicado_a_factura)}.`;
            if (resultado.excedente_a_saldo_favor > 0) {
                mensaje += ` Excedente guardado como saldo a favor: ${formatMoneda(resultado.excedente_a_saldo_favor)}.`;
            }
            alert(mensaje);

            setValorAbono('');
            setDescripcion('');
            await refrescarTodo();
        } catch (err) {
            console.error(err);
            alert('Error al registrar el abono.');
        } finally {
            setGuardando(false);
        }
    };

    const handleAplicarSaldo = async () => {
        if (!idCliente || !idFactura || !fecha) {
            alert('Selecciona cliente, factura y fecha antes de aplicar el saldo.');
            return;
        }
        if (!window.confirm('¿Aplicar el saldo a favor disponible del cliente a esta factura?')) return;
        setGuardando(true);
        try {
            const resultado = await aplicarSaldoAFavor({ id_persona_cliente: idCliente, id_factura: idFactura, fecha });
            alert(`Saldo aplicado: ${formatMoneda(resultado.monto_aplicado)}`);
            await refrescarTodo();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al aplicar el saldo a favor.');
        } finally {
            setGuardando(false);
        }
    };

    if (cargandoDatos) return <p>Cargando datos...</p>;

    return (
        <div>
            <h2>Registrar Abono</h2>

            <form onSubmit={handleGuardarAbono}>
                <label>Cliente: </label>
                <select value={idCliente} onChange={(e) => handleSeleccionarCliente(e.target.value)} required>
                    <option value="">-- Selecciona un cliente --</option>
                    {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                    ))}
                </select>

                {clienteSeleccionado && (
                    <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--color-ink-soft)' }}>
                        Saldo a favor actual: <strong>{formatMoneda(clienteSeleccionado.saldo_a_favor || 0)}</strong>
                    </span>
                )}

                <br /><br />

                <label>Factura: </label>
                <select value={idFactura} onChange={(e) => handleSeleccionarFactura(e.target.value)} required disabled={!idCliente}>
                    <option value="">-- Selecciona una factura --</option>
                    {facturasDelCliente.map((f) => (
                        <option key={f.id} value={f.id}>
                            #{f.id} — {f.fecha ? f.fecha.slice(0, 10) : ''} — Total: {formatMoneda(f.total_pagar)}
                        </option>
                    ))}
                </select>

                {resumen && (
                    <div style={{ marginTop: '12px', padding: '10px', border: '1px solid var(--color-line)', borderRadius: '4px', background: 'var(--color-bg)' }}>
                        <p style={{ margin: '2px 0' }}>Total de la factura: {formatMoneda(resumen.total_pagar)}</p>
                        <p style={{ margin: '2px 0' }}>Ya abonado: {formatMoneda(resumen.total_abonado)}</p>
                        <p style={{ margin: '2px 0', fontWeight: 600 }}>Saldo pendiente: {formatMoneda(resumen.saldo_pendiente)}</p>
                    </div>
                )}

                <br />
                <label>Fecha: </label>
                <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} required />

                <label style={{ marginLeft: '15px' }}>Valor del abono: </label>
                <input type="number" step="0.01" value={valorAbono} onChange={(e) => setValorAbono(e.target.value)} required />

                <label style={{ marginLeft: '15px' }}>Descripción: </label>
                <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" />

                <br /><br />
                <button type="submit" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Registrar Abono'}
                </button>

                {clienteSeleccionado && clienteSeleccionado.saldo_a_favor > 0 && idFactura && resumen && resumen.saldo_pendiente > 0 && (
                    <button type="button" onClick={handleAplicarSaldo} disabled={guardando} style={{ marginLeft: '10px' }}>
                        Aplicar saldo a favor a esta factura
                    </button>
                )}
            </form>
        </div>
    );
}

export default NuevoAbonoPage;