function TablaGenerica({ columnas, datos, acciones = [] }) {
    return (
        <table>
            <thead>
                <tr>
                    {columnas.map((col) => (
                        <th key={col.campo}>{col.titulo}</th>
                    ))}
                    {acciones.length > 0 && <th>Acciones</th>}
                </tr>
            </thead>
            <tbody>
                {datos.map((fila) => (
                    <tr key={fila.id}>
                        {columnas.map((col) => (
                            <td key={col.campo}>{col.render ? col.render(fila) : fila[col.campo]}</td>
                        ))}
                        {acciones.length > 0 && (
                            <td className="acciones-celda">
                                {acciones.map((accion) => (
                                    <button
                                        key={accion.etiqueta}
                                        className={accion.tipo === 'peligro' ? 'btn-peligro' : 'btn-secundario'}
                                        onClick={() => accion.onClick(fila)}
                                    >
                                        {accion.etiqueta}
                                    </button>
                                ))}
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default TablaGenerica;