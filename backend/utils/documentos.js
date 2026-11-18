const { redondear2, subtotalLinea, sumarDinero } = require('./calculos');

// Límites que respetan lo que aguantan las columnas de la base de datos
const MAX_LINEAS = 200;
const MAX_PESO_KG = 9999;
const MAX_PRECIO = 999999;
const MAX_TOTAL = 9999999999;
const MAX_DESCRIPCION = 200;

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

// Error "esperado": se le muestra tal cual al usuario
class ErrorNegocio extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

// Devuelve un texto con el problema, o null si todo está bien
const validarCabecera = ({ fecha, descripcion }) => {
    if (!fecha || !REGEX_FECHA.test(String(fecha))) return 'La fecha no es válida.';
    if (descripcion && String(descripcion).length > MAX_DESCRIPCION) {
        return `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres.`;
    }
    return null;
};

// Valida las líneas y calcula subtotales y total EN EL SERVIDOR
// (no se confía en los números que calcule la pantalla).
// Devuelve { error } o { lineas, total }.
const prepararLineas = (lineas) => {
    if (!Array.isArray(lineas) || lineas.length === 0) return { error: 'Agrega al menos un producto.' };
    if (lineas.length > MAX_LINEAS) return { error: `No puede haber más de ${MAX_LINEAS} productos en un mismo documento.` };

    const preparadas = [];
    for (let i = 0; i < lineas.length; i++) {
        const l = lineas[i] || {};
        const n = i + 1;
        const idProducto = Number(l.id_producto);
        const idPresentacion = Number(l.id_presentacion);
        if (!Number.isInteger(idProducto) || idProducto <= 0) return { error: `Producto ${n}: falta elegir el producto.` };
        if (!Number.isInteger(idPresentacion) || idPresentacion <= 0) return { error: `Producto ${n}: falta elegir la presentación.` };

        const peso = redondear2(l.peso_total_kg);
        const precio = redondear2(l.precio_por_kg);
        if (!(peso > 0)) return { error: `Producto ${n}: la cantidad debe ser mayor a cero.` };
        if (peso > MAX_PESO_KG) return { error: `Producto ${n}: la cantidad es demasiado grande.` };
        if (!(precio >= 0)) return { error: `Producto ${n}: el precio no es válido.` };
        if (precio > MAX_PRECIO) return { error: `Producto ${n}: el precio es demasiado grande.` };

        preparadas.push({
            id_producto: idProducto,
            id_presentacion: idPresentacion,
            peso, precio,
            subtotal: subtotalLinea(peso, precio)
        });
    }

    const total = sumarDinero(preparadas.map((l) => l.subtotal));
    if (total > MAX_TOTAL) return { error: 'El total es demasiado grande.' };
    return { lineas: preparadas, total };
};

// Pago que se recibe al crear la factura: todo (de contado) o un abono parcial.
// Devuelve { valor } o { error }.
const calcularPagoInicial = (pagoCompleto, abono, total) => {
    if (pagoCompleto) return { valor: total };
    if (abono === undefined || abono === null || abono === '') return { valor: 0 };
    const numero = Number(abono);
    if (!Number.isFinite(numero) || numero < 0) return { error: 'El abono no es válido.' };
    const valor = redondear2(numero);
    if (valor > total) {
        return { error: 'El abono no puede ser mayor al total de la factura. Si el cliente pagó de más, regístralo desde "Registrar abono".' };
    }
    return { valor };
};

// Respuesta de error uniforme: mensajes claros para el usuario y sin exponer detalles de MySQL
const manejarError = (res, error) => {
    if (error instanceof ErrorNegocio) {
        return res.status(error.status).json({ error: error.message });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            error: 'El cliente, el proveedor, un producto o una presentación ya no existe. Recarga la página e inténtalo de nuevo.'
        });
    }
    console.error(error);
    return res.status(500).json({ error: 'No se pudo guardar. Inténtalo de nuevo.' });
};

module.exports = { ErrorNegocio, validarCabecera, prepararLineas, calcularPagoInicial, manejarError };