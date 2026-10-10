import { useRef } from 'react';

function VisorPDF({ url, nombreArchivo, titulo, onCerrar }) {
    const iframeRef = useRef(null);

    const imprimir = () => {
        try {
            iframeRef.current.contentWindow.focus();
            iframeRef.current.contentWindow.print();
        } catch (err) {
            console.error(err);
            window.open(url, '_blank'); // plan B: abrirlo en una pestaña y usar su botón de imprimir
        }
    };

    const descargar = () => {
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreArchivo;
        enlace.click();
    };

    return (
        <div className="visor-overlay">
            <div className="visor-caja">
                <div className="visor-cabecera">
                    <h3>{titulo || 'Vista previa'}</h3>
                    <button type="button" className="btn-secundario" onClick={onCerrar}>Cerrar</button>
                </div>
                <iframe ref={iframeRef} className="visor-iframe" src={url} title="Vista previa de la factura" />
                <div className="visor-acciones">
                    <button type="button" className="btn-secundario" onClick={descargar}>Descargar</button>
                    <button type="button" onClick={imprimir}>Imprimir</button>
                </div>
            </div>
        </div>
    );
}

export default VisorPDF;