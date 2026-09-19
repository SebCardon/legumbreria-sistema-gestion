import jsPDF from 'jspdf';
import { formatNumero } from './format';

// Datos fijos del negocio — cámbialos aquí si algo cambia, un solo lugar
const NEGOCIO = {
    nombre: 'Legumbres y Verduras Aristizábal',
    propietario: 'David Leandro Aristizábal Giraldo',
    nit: 'NIT. 1.036.616.566-3 Régimen Simplificado',
    direccion: 'Central Minorista José María Villa — Sector 3 Locales 223-224',
    telefono: 'Cel: 311 709 92 33',
    lema: 'Ventas por mayor y detal — ¡Ven y danos el gusto de atenderte!'
};

export function generarFacturaPDF({ factura, clienteNombre, lineas, totalAbonado = 0 }) {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;

    // --- Encabezado verde con los datos del negocio ---
    doc.setFillColor(47, 122, 75);
    doc.rect(0, 0, pageWidth, 95, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(NEGOCIO.nombre, marginX, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(NEGOCIO.propietario, marginX, 45);
    doc.text(NEGOCIO.nit, marginX, 57);
    doc.text(NEGOCIO.direccion, marginX, 69);
    doc.text(`${NEGOCIO.telefono}  ·  ${NEGOCIO.lema}`, marginX, 81);

    // --- Número de factura, arriba a la derecha ---
    doc.setFontSize(10);
    doc.text('FACTURA DE VENTA', pageWidth - marginX, 28, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`No. ${String(factura.id).padStart(5, '0')}`, pageWidth - marginX, 50, { align: 'right' });

    // --- Datos de la venta ---
    let y = 118;
    doc.setTextColor(35, 48, 31);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const fechaTexto = factura.fecha ? new Date(factura.fecha).toLocaleDateString('es-CO') : '';
    doc.text(`Fecha: ${fechaTexto}`, marginX, y);
    doc.text(`Vendido a: ${clienteNombre}`, marginX, y + 16);
    if (factura.descripcion) {
        doc.text(`Observaciones: ${factura.descripcion}`, marginX, y + 32);
        y += 16;
    }
    y += 45;

    // --- Encabezado de la tabla ---
    const col = { cant: marginX + 4, desc: marginX + 65, vu: marginX + 330, vt: marginX + 430 };
    doc.setFillColor(230, 240, 230);
    doc.rect(marginX, y, pageWidth - marginX * 2, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CANT. (KG)', col.cant, y + 14);
    doc.text('DESCRIPCIÓN', col.desc, y + 14);
    doc.text('VR. UNITARIO', col.vu, y + 14);
    doc.text('VR. TOTAL', col.vt, y + 14);
    y += 20;

    // --- Filas de productos ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    lineas.forEach((linea) => {
        doc.text(String(linea.cantidad), col.cant, y + 14);
        doc.text(linea.descripcion, col.desc, y + 14);
        doc.text(`$${formatNumero(linea.vrUnitario)}`, col.vu, y + 14);
        doc.text(`$${formatNumero(linea.vrTotal)}`, col.vt, y + 14);
        doc.setDrawColor(216, 210, 194);
        doc.line(marginX, y + 20, pageWidth - marginX, y + 20);
        y += 20;

        // Si se llena la página, empieza una hoja nueva
        if (y > 700) {
            doc.addPage();
            y = 60;
        }
    });

    // --- Filas de productos ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    if (lineas.length === 0) {
        doc.setTextColor(150, 60, 60);
        doc.text('Esta factura no tiene productos registrados en el sistema.', marginX, y + 14);
        y += 30;
    } else {
        lineas.forEach((linea) => {
            doc.text(String(linea.cantidad), col.cant, y + 14);
            doc.text(linea.descripcion, col.desc, y + 14);
            doc.text(`$${formatNumero(linea.vrUnitario)}`, col.vu, y + 14);
            doc.text(`$${formatNumero(linea.vrTotal)}`, col.vt, y + 14);
            doc.setDrawColor(216, 210, 194);
            doc.line(marginX, y + 20, pageWidth - marginX, y + 20);
            y += 20;

            if (y > 700) {
                doc.addPage();
                y = 60;
            }
        });
    }

    // --- Total ---
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`TOTAL $ ${formatNumero(factura.total_pagar)}`, pageWidth - marginX, y, { align: 'right' });

    // --- Abonos, si aplica ---
    if (totalAbonado > 0) {
        const pendiente = Math.max(Number(factura.total_pagar) - totalAbonado, 0);
        y += 18;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Abonado: $${formatNumero(totalAbonado)}`, pageWidth - marginX, y, { align: 'right' });
        y += 14;
        doc.text(`Saldo pendiente: $${formatNumero(pendiente)}`, pageWidth - marginX, y, { align: 'right' });
    }

    doc.save(`factura_${factura.id}.pdf`);
}