import { useState, useEffect } from 'react';
import { getProductos, createProducto, updateProducto, desactivarProducto } from '../services/productosService';
import { getCategorias } from '../services/categoriaService';
import TablaGenerica from '../components/TablaGenerica';
import { formatMoneda, formatNumero } from '../utils/format';

const columnas = [
    { campo: 'id', titulo: 'ID' },
    { campo: 'nombre', titulo: 'Nombre' },
    { campo: 'descripcion', titulo: 'Descripción' },
    { campo: 'precio_venta_kg', titulo: 'Precio Venta/Kg', render: (fila) => formatMoneda(fila.precio_venta_kg) },
    { campo: 'costo_kg', titulo: 'Costo/Kg', render: (fila) => formatMoneda(fila.costo_kg) },
    { campo: 'cantidad_kg', titulo: 'Stock (Kg)', render: (fila) => formatNumero(fila.cantidad_kg) }
];

const formVacio = {
    nombre: '', descripcion: '', precio_venta_kg: '', costo_kg: '',
    cantidad_kg: 0, id_categoria: '', id_estado: 1
};

function ProductosPage() {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);

    const cargarProductos = async () => {
        setCargando(true);
        const [dataProductos, dataCategorias] = await Promise.all([getProductos(), getCategorias()]);
        setProductos(dataProductos);
        setCategorias(dataCategorias);
        setCargando(false);
    };

    useEffect(() => { cargarProductos(); }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editandoId) {
                await updateProducto(editandoId, formData);
            } else {
                await createProducto(formData);
            }
            setFormData(formVacio);
            setEditandoId(null);
            cargarProductos();
        } catch (err) {
            console.error(err);
            alert('Error al guardar el producto.');
        }
    };

    const handleEditar = (fila) => {
        setFormData({
            nombre: fila.nombre,
            descripcion: fila.descripcion || '',
            precio_venta_kg: fila.precio_venta_kg,
            costo_kg: fila.costo_kg,
            cantidad_kg: fila.cantidad_kg,
            id_categoria: fila.id_categoria,
            id_estado: fila.id_estado
        });
        setEditandoId(fila.id);
    };

    const handleCancelar = () => { setFormData(formVacio); setEditandoId(null); };

    const handleDesactivar = async (fila) => {
        try {
            await desactivarProducto(fila.id);
            cargarProductos();
        } catch (err) {
            console.error(err);
            alert('Error al desactivar.');
        }
    };

    if (cargando) return <p>Cargando productos...</p>;

    return (
        <div>
            <h2>Productos</h2>
            <form onSubmit={handleSubmit}>
                <input name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
                <input name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} />
                <input name="precio_venta_kg" type="number" step="0.01" placeholder="Precio Venta/Kg" value={formData.precio_venta_kg} onChange={handleChange} required />
                <input name="costo_kg" type="number" step="0.01" placeholder="Costo/Kg" value={formData.costo_kg} onChange={handleChange} required />
                <input name="cantidad_kg" type="number" step="0.01" placeholder="Stock (Kg)" value={formData.cantidad_kg} onChange={handleChange} />

                <select name="id_categoria" value={formData.id_categoria} onChange={handleChange} required>
                    <option value="">-- Categoría --</option>
                    {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                </select>

                <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar Producto'}</button>
                {editandoId && <button type="button" onClick={handleCancelar}>Cancelar</button>}
            </form>
            <TablaGenerica
                columnas={columnas}
                datos={productos}
                acciones={[
                    { etiqueta: 'Editar', onClick: handleEditar },
                    { etiqueta: 'Desactivar', onClick: handleDesactivar, tipo: 'peligro' }
                ]}
            />
        </div>
    );
}

export default ProductosPage;