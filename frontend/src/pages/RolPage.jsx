import { useState, useEffect } from 'react';
import { getRoles, createRol, updateRol, deleteRol } from '../services/rolService';
import TablaGenerica from '../components/TablaGenerica';

const columnas = [
    { campo: 'id', titulo: 'ID' },
    { campo: 'nombre', titulo: 'Nombre' },
    { campo: 'descripcion', titulo: 'Descripción' }
];

const formVacio = { nombre: '', descripcion: '' };

function RolPage() {
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);

    const cargar = async () => {
        setCargando(true);
        setItems(await getRoles());
        setCargando(false);
    };

    useEffect(() => { cargar(); }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editandoId) {
                await updateRol(editandoId, formData);
            } else {
                await createRol(formData);
            }
            setFormData(formVacio);
            setEditandoId(null);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al guardar el rol.');
        }
    };

    const handleEditar = (fila) => {
        setFormData({ nombre: fila.nombre, descripcion: fila.descripcion || '' });
        setEditandoId(fila.id);
    };

    const handleCancelar = () => {
        setFormData(formVacio);
        setEditandoId(null);
    };

    const handleEliminar = async (fila) => {
        if (!window.confirm('¿Eliminar este rol?')) return;
        try {
            await deleteRol(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al eliminar.');
        }
    };

    if (cargando) return <p>Cargando roles...</p>;

    return (
        <div>
            <h2>Roles</h2>
            <form onSubmit={handleSubmit}>
                <input name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
                <input name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} />
                <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar Rol'}</button>
                {editandoId && <button type="button" onClick={handleCancelar}>Cancelar</button>}
            </form>
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

export default RolPage;