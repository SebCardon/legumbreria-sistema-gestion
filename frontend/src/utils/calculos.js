// Cálculos de dinero y peso. Deben ser idénticos a backend/utils/calculos.js
// (si cambias algo aquí, cámbialo también allá).
//
// No hay ninguna regla de redondeo del negocio: solo se respeta la precisión que ya
// guarda la base de datos (peso y precio con 2 decimales, subtotal con 2 decimales).

export const redondear2 = (valor) => Math.round((Number(valor) || 0) * 100) / 100;

// peso x precio con exactitud de centavos. Se multiplica con enteros para evitar errores de
// coma flotante (ej: 0.07 x 1500 da 105.00000000000001 en JavaScript).
export const subtotalLinea = (peso, precio) => {
    const centesimasKg = Math.round((Number(peso) || 0) * 100);
    const centavosPorKg = Math.round((Number(precio) || 0) * 100);
    return Math.round((centesimasKg * centavosPorKg) / 100) / 100;
};

// Suma de dinero sin ruido de decimales
export const sumarDinero = (valores) =>
    valores.reduce((acc, v) => acc + Math.round((Number(v) || 0) * 100), 0) / 100;