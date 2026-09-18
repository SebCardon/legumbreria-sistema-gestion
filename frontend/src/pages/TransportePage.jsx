import { useState, useEffect } from 'react';
import { getTransportes, createTransporte, updateTransporte, deleteTransporte } from '../services/transporteService';
import { getPersonas } from '../services/personasService';
import { getRoles } from '../services/rolService';
import TablaGenerica from '../components/TablaGenerica';
import { formatMoneda } from '../utils/format';

const formVacio = { id_persona_conductor: '', placa_vehiculo: '', fecha: '', valor_transporte: '' };

function TransportePage() {
    const [items, setItems] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [todasLasPersonas, setTodasLasPersonas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);

    const cargar = async () => {
        setCargando(true);
        const [dataItems, dataPersonas, dataRoles] = await Promise.all([
            getTransportes(), getPersonas(), getRoles()
        ]);

        const rolConductor = dataRoles.find((r) => r.nombre.toLowerCase() === 'conductor');
        const soloConductores = rolConductor
            ? dataPersonas.filter((p) => p.id_rol === rolConductor.id)
            : [];

        setConductores(soloConductores);
        setTodasLasPersonas(dataPersonas);
        setItems(dataItems);
        setCargando(false);
    };

    useEffect(() => { cargar(); }, []);

    const nombreConductor = (id) => {
        const persona = todasLasPersonas.find((p) => p.id === id);
        return persona ? `${persona.nombre} ${persona.apellido}` : `ID ${id}`;
    };

    const columnas = [
        { campo: 'id', titulo: 'ID' },
        { campo: 'id_persona_conductor', titulo: 'Conductor', render: (fila) => nombreConductor(fila.id_persona_conductor) },
        { campo: 'placa_vehiculo', titulo: 'Placa' },
        { campo: 'fecha', titulo: 'Fecha' },
        {
            campo: 'valor_transporte',
            titulo: 'Valor',
            render: (fila) => fila.valor_transporte === null ? 'Pendiente' : formatMoneda(fila.valor_transporte)
        }
    ];
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editandoId) {
                await updateTransporte(editandoId, formData);
            } else {
                await createTransporte(formData);
            }
            setFormData(formVacio);
            setEditandoId(null);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al guardar el transporte.');
        }
    };

    const handleEditar = (fila) => {
        setFormData({
            id_persona_conductor: fila.id_persona_conductor,
            placa_vehiculo: fila.placa_vehiculo,
            fecha: fila.fecha ? fila.fecha.slice(0, 16) : '',
            valor_transporte: fila.valor_transporte
        });
        setEditandoId(fila.id);
    };

    const handleCancelar = () => { setFormData(formVacio); setEditandoId(null); };

    const handleEliminar = async (fila) => {
        if (!window.confirm('¿Eliminar este transporte?')) return;
        try {
            await deleteTransporte(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al eliminar.');
        }
    };

    if (cargando) return <p>Cargando transportes...</p>;

    return (
        <div>
            <h2>Transporte</h2>
            <form onSubmit={handleSubmit}>
                <select name="id_persona_conductor" value={formData.id_persona_conductor} onChange={handleChange} required>
                    <option value="">-- Selecciona un conductor --</option>
                    {conductores.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                    ))}
                </select>
                <input name="placa_vehiculo" placeholder="Placa" value={formData.placa_vehiculo} onChange={handleChange} required />
                <input name="fecha" type="datetime-local" value={formData.fecha} onChange={handleChange} required />
                <input name="valor_transporte" type="number" step="0.01" placeholder="Valor (déjalo vacío si aún no se sabe)" value={formData.valor_transporte} onChange={handleChange} required />
                <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar Transporte'}</button>
                {editandoId && <button type="button" onClick={handleCancelar}>Cancelar</button>}
            </form>
            {conductores.length === 0 && (
                <p style={{ color: 'var(--color-danger)' }}>
                    No hay personas con rol "Conductor" registradas todavía.
                </p>
            )}
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

export default TransportePage;