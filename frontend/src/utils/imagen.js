export function redimensionarImagen(archivo, lado = 240, calidad = 0.75) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
        lector.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('El archivo no es una imagen válida'));
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = lado;
                canvas.height = lado;
                const ctx = canvas.getContext('2d');

                // Fondo blanco, por si la imagen es PNG con transparencia
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, lado, lado);

                // Recorte cuadrado centrado
                const ladoOrigen = Math.min(img.width, img.height);
                const sx = (img.width - ladoOrigen) / 2;
                const sy = (img.height - ladoOrigen) / 2;
                ctx.drawImage(img, sx, sy, ladoOrigen, ladoOrigen, 0, 0, lado, lado);

                resolve(canvas.toDataURL('image/jpeg', calidad));
            };
            img.src = lector.result;
        };
        lector.readAsDataURL(archivo);
    });
}