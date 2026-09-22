import jsPDF from 'jspdf';
import { formatNumero } from './format';

const NEGOCIO = {
    nombre: 'Legumbres y Verduras Aristizábal',
    propietario: 'David Leandro Aristizábal Giraldo',
    nit: 'NIT. 1.036.616.566-3',
    regimen: 'Régimen Simplificado',
    direccionLineas: ['Central Minorista José María Villa', 'Sector 3 Locales 223-224'],
    telefono: 'Cel: 311 709 92 33',
    lema1: 'Ventas por mayor y detal',
    lema2: '¡Ven y danos el gusto de atenderte!'
};

const ANCHO_MM = 80; // Cambia a 58 si tu impresora térmica es de rollo angosto
const MARGEN_MM = 4;
const ANCHO_UTIL = ANCHO_MM - MARGEN_MM * 2;

export function generarFacturaPDF({ factura, clienteNombre, lineas, totalAbonado = 0 }) {
    const alturaEncabezado = 55;
    const alturaPorLinea = 9;
    const alturaPie = 20 + (totalAbonado > 0 ? 10 : 0);
    const alturaEstimada = Math.max(alturaEncabezado + lineas.length * alturaPorLinea + alturaPie, 100);

    const doc = new jsPDF({ unit: 'mm', format: [ANCHO_MM, alturaEstimada] });
    const centro = ANCHO_MM / 2;
    let y = 6;

    // --- Encabezado del negocio ---
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(NEGOCIO.nombre, centro, y, { align: 'center', maxWidth: ANCHO_UTIL });
    y += 5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text(NEGOCIO.propietario, centro, y, { align: 'center' }); y += 3.2;
    doc.text(`${NEGOCIO.nit} ${NEGOCIO.regimen}`, centro, y, { align: 'center' }); y += 3.2;
    NEGOCIO.direccionLineas.forEach((linea) => {
        doc.text(linea, centro, y, { align: 'center' });
        y += 3.2;
    });
    doc.text(NEGOCIO.telefono, centro, y, { align: 'center' }); y += 3.2;
    doc.text(NEGOCIO.lema1, centro, y, { align: 'center' }); y += 3.2;
    doc.text(NEGOCIO.lema2, centro, y, { align: 'center', maxWidth: ANCHO_UTIL }); y += 5;

    doc.setLineDashPattern([0.6, 0.6], 0);
    doc.line(MARGEN_MM, y, ANCHO_MM - MARGEN_MM, y);
    y += 4;

    // --- Número de factura y datos de la venta ---
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text('FACTURA DE VENTA', centro, y, { align: 'center' }); y += 4;
    doc.text(`No. ${String(factura.id).padStart(5, '0')}`, centro, y, { align: 'center' }); y += 5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    const fechaTexto = factura.fecha ? new Date(factura.fecha).toLocaleDateString('es-CO') : '';
    doc.text(`Fecha: ${fechaTexto}`, MARGEN_MM, y); y += 3.5;
    doc.text(`Cliente: ${clienteNombre}`, MARGEN_MM, y, { maxWidth: ANCHO_UTIL }); y += 5;

    doc.line(MARGEN_MM, y, ANCHO_MM - MARGEN_MM, y);
    y += 4;

    // --- Productos (formato de dos renglones por línea, ideal para papel angosto) ---
    if (lineas.length === 0) {
        doc.setTextColor(150, 40, 40);
        doc.text('Esta factura no tiene productos registrados.', MARGEN_MM, y, { maxWidth: ANCHO_UTIL });
        y += 6;
        doc.setTextColor(0, 0, 0);
    } else {
        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        lineas.forEach((linea) => {
            doc.text(linea.descripcion, MARGEN_MM, y, { maxWidth: ANCHO_UTIL });
            y += 3.5;
            doc.text(`${linea.cantidad} x $${formatNumero(linea.vrUnitario)}`, MARGEN_MM, y);
            doc.text(`$${formatNumero(linea.vrTotal)}`, ANCHO_MM - MARGEN_MM, y, { align: 'right' });
            y += 5;
        });
    }

    doc.line(MARGEN_MM, y, ANCHO_MM - MARGEN_MM, y);
    y += 5;

    // --- Total ---
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text(`TOTAL $ ${formatNumero(factura.total_pagar)}`, ANCHO_MM - MARGEN_MM, y, { align: 'right' });
    y += 6;

    if (totalAbonado > 0) {
        const pendiente = Math.max(Number(factura.total_pagar) - totalAbonado, 0);
        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        doc.text(`Abonado: $${formatNumero(totalAbonado)}`, ANCHO_MM - MARGEN_MM, y, { align: 'right' }); y += 3.5;
        doc.text(`Pendiente: $${formatNumero(pendiente)}`, ANCHO_MM - MARGEN_MM, y, { align: 'right' }); y += 5;
    }

    doc.setFont('courier', 'italic');
    doc.setFontSize(7);
    doc.text('¡Gracias por su compra!', centro, y, { align: 'center' });

    doc.save(`factura_${factura.id}.pdf`);
}