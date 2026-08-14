// ============================================
// CARGAR SHAPES DEL GTFS
// ============================================

async function cargarShapes() {

    console.log("🗺️ Cargando shapes.txt...");

    const respuesta = await fetch("gtfs/shapes.txt");

    if (!respuesta.ok) {
        throw new Error(
            "No se pudo cargar shapes.txt: " +
            respuesta.status
        );
    }

    const texto = await respuesta.text();

    console.log(
        "✅ shapes.txt cargado"
    );

    return texto;
}


// ============================================
// OBTENER UN SHAPE CONCRETO
// ============================================

function obtenerShape(texto, shapeId) {

    const lineas = texto.trim().split("\n");

    // Quitamos la cabecera
    lineas.shift();

    const puntos = [];

    for (const linea of lineas) {

        const columnas = linea.split(",");

        const id = columnas[0];

        if (id == shapeId) {

            const lat = parseFloat(columnas[1]);
            const lon = parseFloat(columnas[2]);
            const secuencia = parseInt(columnas[3]);

            puntos.push({
                lat: lat,
                lon: lon,
                secuencia: secuencia
            });
        }
    }

    // Ordenar por secuencia
    puntos.sort(
        (a, b) => a.secuencia - b.secuencia
    );

    return puntos;
}