import jsPDF from 'jspdf';
import { formatNumero } from './format';

export function generarReportePDF({ periodoLabel, resumen, filas }) {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let y = 40;

    // --- Encabezado ---
    doc.setFillColor(47, 122, 75);
    doc.rect(0, 0, pageWidth, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Reporte de Compras y Ventas', marginX, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Periodo: ${periodoLabel}`, marginX, 50);

    y = 100;
    doc.setTextColor(35, 48, 31);

    // --- Tarjetas de resumen ---
    const anchoTarjeta = (pageWidth - marginX * 2 - 20) / 3;
    const tarjetas = [
        { titulo: 'Total comprado', valor: `$${formatNumero(resumen.totalCompradoValor)}` },
        { titulo: 'Total vendido', valor: `$${formatNumero(resumen.totalVendidoValor)}` },
        { titulo: 'Utilidad bruta', valor: `$${formatNumero(resumen.utilidad)}` }
    ];
    tarjetas.forEach((t, i) => {
        const x = marginX + i * (anchoTarjeta + 10);
        doc.setDrawColor(216, 210, 194);
        doc.rect(x, y, anchoTarjeta, 50);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(t.titulo, x + 10, y + 18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(t.valor, x + 10, y + 38);
    });
    y += 75;

    // --- Encabezado de tabla ---
    const col = { prod: marginX, kgC: marginX + 190, kgV: marginX + 260, valC: marginX + 330, valV: marginX + 420 };
    doc.setFillColor(230, 240, 230);
    doc.rect(marginX, y, pageWidth - marginX * 2, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PRODUCTO', col.prod + 4, y + 14);
    doc.text('KG COMPR.', col.kgC, y + 14);
    doc.text('KG VEND.', col.kgV, y + 14);
    doc.text('$ COMPRADO', col.valC, y + 14);
    doc.text('$ VENDIDO', col.valV, y + 14);
    y += 20;

    // --- Filas por producto ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    filas.forEach((fila) => {
        doc.text(fila.producto, col.prod + 4, y + 14, { maxWidth: 180 });
        doc.text(formatNumero(fila.kgComprado), col.kgC, y + 14);
        doc.text(formatNumero(fila.kgVendido), col.kgV, y + 14);
        doc.text(`$${formatNumero(fila.valorComprado)}`, col.valC, y + 14);
        doc.text(`$${formatNumero(fila.valorVendido)}`, col.valV, y + 14);
        doc.setDrawColor(216, 210, 194);
        doc.line(marginX, y + 20, pageWidth - marginX, y + 20);
        y += 20;

        if (y > 700) {
            doc.addPage();
            y = 40;
        }
    });

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`TOTAL — Comprado: $${formatNumero(resumen.totalCompradoValor)}   Vendido: $${formatNumero(resumen.totalVendidoValor)}`, marginX, y);

    doc.save(`reporte_${periodoLabel.replace(/\s+/g, '_')}.pdf`);
}