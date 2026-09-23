import { useState, useEffect } from 'react';
import { getPersonas, createPersona, updatePersona, desactivarPersona } from '../services/personasService';
import { getTiposDocumento } from '../services/tipoDocumentoService';
import { getRoles } from '../services/rolService';
import TablaGenerica from '../components/TablaGenerica';
import { formatMoneda } from '../utils/format';

const columnas = [
    { campo: 'id', titulo: 'ID' },
    { campo: 'nombre', titulo: 'Nombre' },
    { campo: 'apellido', titulo: 'Apellido' },
    { campo: 'num_documento', titulo: 'Documento', render: (fila) => fila.num_documento || '—' },
    { campo: 'telefono', titulo: 'Teléfono' },
    { campo: 'correo', titulo: 'Correo' },
    { campo: 'saldo_a_favor', titulo: 'Saldo a favor', render: (fila) => formatMoneda(fila.saldo_a_favor || 0) }
];

const formVacio = {
    nombre: '', apellido: '', num_documento: '', id_tipo_documento: '',
    telefono: '', correo: '', id_estado: 1, id_rol: ''
};

function PersonasPage() {
    const [personas, setPersonas] = useState([]);
    const [tiposDocumento, setTiposDocumento] = useState([]);
    const [roles, setRoles] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);

    const cargarPersonas = async () => {
        try {
            setCargando(true);
            const [dataPersonas, dataTipos, dataRoles] = await Promise.all([
                getPersonas(), getTiposDocumento(), getRoles()
            ]);
            setPersonas(dataPersonas);
            setTiposDocumento(dataTipos);
            setRoles(dataRoles);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('No se pudieron cargar las personas.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarPersonas(); }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editandoId) {
                await updatePersona(editandoId, formData);
            } else {
                await createPersona(formData);
            }
            setFormData(formVacio);
            setEditandoId(null);
            cargarPersonas();
        } catch (err) {
            console.error(err);
            alert('Error al guardar la persona.');
        }
    };

    const handleEditar = (fila) => {
        setFormData({
            nombre: fila.nombre,
            apellido: fila.apellido,
            num_documento: fila.num_documento,
            id_tipo_documento: fila.id_tipo_documento,
            telefono: fila.telefono || '',
            correo: fila.correo || '',
            id_estado: fila.id_estado,
            id_rol: fila.id_rol
        });
        setEditandoId(fila.id);
    };

    const handleCancelar = () => { setFormData(formVacio); setEditandoId(null); };

    const handleDesactivar = async (fila) => {
        try {
            await desactivarPersona(fila.id);
            cargarPersonas();
        } catch (err) {
            console.error(err);
            alert('Error al desactivar.');
        }
    };

    if (cargando) return <p>Cargando personas...</p>;

    return (
        <div>
            <h2>Personas</h2>
            <form onSubmit={handleSubmit}>
                <input name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
                <input name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleChange} required />
                <input name="num_documento" placeholder="Documento" value={formData.num_documento} onChange={handleChange} />

                <select name="id_tipo_documento" value={formData.id_tipo_documento} onChange={handleChange} >
                    <option value="">-- Tipo de documento --</option>
                    {tiposDocumento.map((t) => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                </select>

                <input name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} />
                <input name="correo" placeholder="Correo" value={formData.correo} onChange={handleChange} />

                <select name="id_rol" value={formData.id_rol} onChange={handleChange} required>
                    <option value="">-- Rol --</option>
                    {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                </select>

                <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar Persona'}</button>
                {editandoId && <button type="button" onClick={handleCancelar}>Cancelar</button>}
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <TablaGenerica
                columnas={columnas}
                datos={personas}
                acciones={[
                    { etiqueta: 'Editar', onClick: handleEditar },
                    { etiqueta: 'Desactivar', onClick: handleDesactivar, tipo: 'peligro' }
                ]}
            />
        </div>
    );
}

export default PersonasPage;