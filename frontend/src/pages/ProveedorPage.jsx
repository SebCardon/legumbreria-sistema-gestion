import { useState, useEffect } from 'react';
import { getProveedores, createProveedor, updateProveedor, deleteProveedor } from '../services/proveedorService';
import TablaGenerica from '../components/TablaGenerica';

const columnas = [
    { campo: 'id', titulo: 'ID' },
    { campo: 'nombre', titulo: 'Nombre' },
    { campo: 'telefono', titulo: 'Teléfono' },
    { campo: 'direccion', titulo: 'Dirección' }
];

const formVacio = { nombre: '', telefono: '', direccion: '' };

function ProveedorPage() {
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);

    const cargar = async () => {
        setCargando(true);
        setItems(await getProveedores());
        setCargando(false);
    };

    useEffect(() => { cargar(); }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editandoId) {
                await updateProveedor(editandoId, formData);
            } else {
                await createProveedor(formData);
            }
            setFormData(formVacio);
            setEditandoId(null);
            cargar();
        } catch (err) {
            console.error(err);
            alert('Error al guardar el proveedor.');
        }
    };

    const handleEditar = (fila) => {
        setFormData({ nombre: fila.nombre, telefono: fila.telefono || '', direccion: fila.direccion || '' });
        setEditandoId(fila.id);
    };

    const handleCancelar = () => {
        setFormData(formVacio);
        setEditandoId(null);
    };

    const handleEliminar = async (fila) => {
        if (!window.confirm('¿Eliminar este proveedor?')) return;
        try {
            await deleteProveedor(fila.id);
            cargar();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error al eliminar.');
        }
    };

    if (cargando) return <p>Cargando proveedores...</p>;

    return (
        <div>
            <h2>Proveedores</h2>
            <form onSubmit={handleSubmit}>
                <input name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
                <input name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} />
                <input name="direccion" placeholder="Dirección" value={formData.direccion} onChange={handleChange} />
                <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar Proveedor'}</button>
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

export default ProveedorPage;