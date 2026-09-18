const GRUPOS = [
    {
        titulo: 'Operación',
        items: [
            { key: 'nuevaFactura', label: 'Nueva factura' },
            { key: 'nuevaCompra', label: 'Nueva compra' },
            { key: 'facturas', label: 'Facturas' },
            { key: 'compras', label: 'Compras' },
            { key: 'transporte', label: 'Transporte' }
        ]
    },
    {
        titulo: 'Correcciones',
        items: [
            { key: 'productosXCompra', label: 'Detalle de compras' },
            { key: 'productosXFactura', label: 'Detalle de facturas' }
        ]
    },
    {
        titulo: 'Catálogos',
        items: [
            { key: 'personas', label: 'Personas' },
            { key: 'productos', label: 'Productos' },
            { key: 'proveedores', label: 'Proveedores' },
            { key: 'categorias', label: 'Categorías' },
            { key: 'presentaciones', label: 'Presentaciones' },
            { key: 'tiposDocumento', label: 'Tipos de documento' },
            { key: 'roles', label: 'Roles' },
            { key: 'estados', label: 'Estados' }
        ]
    }
];

function Sidebar({ paginaActiva, onCambiarPagina }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="sidebar-brand-name">Legumbrería</span>
                <span className="sidebar-brand-sub">Sistema de gestión</span>
            </div>

            <nav>
                {GRUPOS.map((grupo) => (
                    <div key={grupo.titulo} className="sidebar-grupo">
                        <p className="sidebar-grupo-titulo">{grupo.titulo}</p>
                        {grupo.items.map((item) => (
                            <button
                                key={item.key}
                                className={`sidebar-link ${paginaActiva === item.key ? 'activo' : ''}`}
                                onClick={() => onCambiarPagina(item.key)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;