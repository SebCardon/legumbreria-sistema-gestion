import jsPDF from 'jspdf';
import { formatNumero } from './format';

export function generarReportePDF({ periodoLabel, resumen, filas }) {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let y = 40;

    doc.setFillColor(47, 122, 75);
    doc.rect(0, 0, pageWidth, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Reporte de Entradas y Salidas', marginX, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Periodo: ${periodoLabel}`, marginX, 50);

    y = 90;
    doc.setTextColor(35, 48, 31);
    doc.setFontSize(8);
    doc.text(
        'Refleja únicamente compras y facturas registradas en el sistema. No representa el balance financiero completo del negocio.',
        marginX, y, { maxWidth: pageWidth - marginX * 2 }
    );
    y += 25;

    const anchoTarjeta = (pageWidth - marginX * 2 - 10) / 2;
    const tarjetas = [
        { titulo: 'Entradas (compras registradas)', valor: `$${formatNumero(resumen.totalEntradaValor)}` },
        { titulo: 'Salidas (facturas registradas)', valor: `$${formatNumero(resumen.totalSalidaValor)}` }
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

    const col = { prod: marginX, kgE: marginX + 220, kgS: marginX + 300, valE: marginX + 380, valS: marginX + 470 };
    doc.setFillColor(230, 240, 230);
    doc.rect(marginX, y, pageWidth - marginX * 2, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PRODUCTO', col.prod + 4, y + 14);
    doc.text('KG ENTRADA', col.kgE, y + 14);
    doc.text('KG SALIDA', col.kgS, y + 14);
    doc.text('$ ENTRADA', col.valE, y + 14);
    doc.text('$ SALIDA', col.valS, y + 14);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    filas.forEach((fila) => {
        doc.text(fila.producto, col.prod + 4, y + 14, { maxWidth: 210 });
        doc.text(formatNumero(fila.kgEntrada), col.kgE, y + 14);
        doc.text(formatNumero(fila.kgSalida), col.kgS, y + 14);
        doc.text(`$${formatNumero(fila.valorEntrada)}`, col.valE, y + 14);
        doc.text(`$${formatNumero(fila.valorSalida)}`, col.valS, y + 14);
        doc.setDrawColor(216, 210, 194);
        doc.line(marginX, y + 20, pageWidth - marginX, y + 20);
        y += 20;

        if (y > 700) {
            doc.addPage();
            y = 40;
        }
    });

    doc.save(`reporte_${periodoLabel.replace(/\s+/g, '_')}.pdf`);
}