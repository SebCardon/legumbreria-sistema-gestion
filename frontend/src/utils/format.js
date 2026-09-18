// Convierte cualquier valor numérico a un número real formateado, sin decimales innecesarios
export const formatNumero = (valor) => {
    const num = Number(valor);
    if (Number.isNaN(num)) return valor;
    return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Igual que formatNumero, pero con símbolo de moneda
export const formatMoneda = (valor) => `$${formatNumero(valor)}`;