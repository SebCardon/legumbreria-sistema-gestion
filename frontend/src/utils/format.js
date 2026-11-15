// Convierte cualquier valor numérico (aunque venga como texto, ej: "8500.00") a un
// número real formateado, sin decimales innecesarios. 25.00 -> "25", 25.50 -> "25,5"
export const formatNumero = (valor) => {
    const num = Number(valor);
    if (Number.isNaN(num)) return valor;
    return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Igual que formatNumero, pero con símbolo de moneda
export const formatMoneda = (valor) => `$${formatNumero(valor)}`;

// Fecha y hora actuales en el formato de <input type="datetime-local">
export const ahoraLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

// ---------------------------------------------------------------------------
// Fechas. El backend entrega los DATETIME como texto ("2026-09-20 02:00:00") y
// ese texto es la hora tal cual se registró. Estas funciones la leen sin
// convertir zonas horarias, así una venta de las 2:00 a. m. siempre se ve a las
// 2:00 a. m. del mismo día, sin importar dónde corra el servidor.
// ---------------------------------------------------------------------------

// "2026-09-20 02:00:00" | "2026-09-20T02:00" | "2026-09-20" | Date  ->  Date (hora local) o null
export const parseFechaLocal = (valor) => {
    if (!valor) return null;
    if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
    const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return null;
    const [, anio, mes, dia, hora = '0', min = '0', seg = '0'] = m;
    return new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(min), Number(seg));
};

const dos = (n) => String(n).padStart(2, '0');

// -> "20/09/2026"
export const formatSoloFecha = (valor) => {
    const f = parseFechaLocal(valor);
    return f ? `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()}` : '';
};

// -> "20/09/2026 02:00"
export const formatFecha = (valor) => {
    const f = parseFechaLocal(valor);
    return f ? `${formatSoloFecha(f)} ${dos(f.getHours())}:${dos(f.getMinutes())}` : '';
};

// -> "2026-09-20T02:00" (lo que necesita <input type="datetime-local"> al editar)
export const aInputLocal = (valor) => {
    const m = String(valor || '').match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    return m ? `${m[1]}T${m[2]}` : '';
};