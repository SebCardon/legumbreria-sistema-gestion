import { useState, useEffect } from 'react';
import { getProductos, getProductoById, createProducto, updateProducto, desactivarProducto } from '../services/productosService';
import { getCategorias } from '../services/categoriaService';
import { formatMoneda } from '../utils/format';
import { redimensionarImagen } from '../utils/imagen';
import TablaGenerica from '../components/TablaGenerica';

const formVacio = {
    nombre: '', descripcion: '', precio_venta_kg: '', costo_kg: '',
    id_categoria: '', id_estado: 1
};

function ProductosPage() {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [formData, setFormData] = useState(formVacio);
    const [editandoId, setEditandoId] = useState(null);
    const [preview, setPreview] = useState(null);
    const [inputArchivoKey, setInputArchivoKey] = useState(0);

    const cargarProductos = async () => {
        setCargando(true);
        const [dataProductos, dataCategorias] = await Promise.all([getProductos(), getCategorias()]);
        setProductos(dataProductos);
        setCategorias(dataCategorias);
        setCargando(false);
    };

    useEffect(() => { cargarProductos(); }, []);

    const nombreCategoria = (id) => {
        const c = categorias.find((cat) => cat.id === id);
        return c ? c.nombre : `ID ${id}`;
    };

    const columnas = [
        { campo: 'id', titulo: 'ID' },
        { campo: 'nombre', titulo: 'Nombre' },
        { campo: 'descripcion', titulo: 'Descripción' },
        { campo: 'precio_venta_kg', titulo: 'Precio Venta/Kg', render: (fila) => formatMoneda(fila.precio_venta_kg) },
        { campo: 'costo_kg', titulo: 'Costo/Kg', render: (fila) => formatMoneda(fila.costo_kg) },
        { campo: 'id_categoria', titulo: 'Categoría', render: (fila) => nombreCategoria(fila.id_categoria) }
    ];

    const limpiarFormulario = () => {
        setFormData(formVacio);
        setEditandoId(null);
        setPreview(null);
        setInputArchivoKey((k) => k + 1); // fuerza a vaciar el input de archivo
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleImagen = async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        try {
            const dataUrl = await redimensionarImagen(archivo);
            setFormData((prev) => ({ ...prev, imagen: dataUrl }));
            setPreview(dataUrl);
        } catch (err) {
            console.error(err);
            alert('No se pudo procesar la imagen.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editandoId) {
                await updateProducto(editandoId, formData);
            } else {
                await createProducto(formData);
            }
            limpiarFormulario();
            cargarProductos();
        } catch (err) {
            console.error(err);
            alert('Error al guardar el producto.');
        }
    };

    const handleEditar = async (fila) => {
        setFormData({
            nombre: fila.nombre,
            descripcion: fila.descripcion || '',
            precio_venta_kg: fila.precio_venta_kg,
            costo_kg: fila.costo_kg,
            id_categoria: fila.id_categoria,
            id_estado: fila.id_estado
        });
        setEditandoId(fila.id);
        setPreview(null);
        setInputArchivoKey((k) => k + 1);

        // El listado no trae la imagen; la pedimos aparte solo para mostrar la vista previa actual
        try {
            const completo = await getProductoById(fila.id);
            setPreview(completo.imagen || null);
        } catch (err) {
            console.error(err);
        }
    };

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

                <select name="id_categoria" value={formData.id_categoria} onChange={handleChange} required>
                    <option value="">-- Categoría --</option>
                    {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                </select>

                <label>{editandoId ? 'Imagen (solo si quieres cambiarla):' : 'Imagen (opcional):'}</label>
                <input key={inputArchivoKey} type="file" accept="image/*" onChange={handleImagen} />
                {preview && (
                    <img
                        src={preview}
                        alt="Vista previa"
                        style={{ width: '44px', height: '44px', objectFit: 'cover', border: '1px solid var(--color-line)', borderRadius: '3px' }}
                    />
                )}

                <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar Producto'}</button>
                {editandoId && <button type="button" onClick={limpiarFormulario}>Cancelar</button>}
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