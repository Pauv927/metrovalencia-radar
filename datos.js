// ============================================
// LECTOR GTFS - METROVALENCIA RADAR
// ============================================

async function cargarArchivoGTFS(nombre) {

    const respuesta = await fetch("gtfs/" + nombre);

    if (!respuesta.ok) {
        throw new Error(
            "No se pudo cargar " +
            nombre +
            " (" +
            respuesta.status +
            ")"
        );
    }

    return await respuesta.text();
}


// ============================================
// PARSER CSV GTFS
// ============================================

function analizarCSV(texto) {

    const lineas = texto.trim().split(/\r?\n/);

    const cabeceras = lineas[0].split(",");

    const resultado = [];

    for (let i = 1; i < lineas.length; i++) {

        const columnas = lineas[i].split(",");

        const objeto = {};

        cabeceras.forEach((cabecera, indice) => {
            objeto[cabecera] = columnas[indice];
        });

        resultado.push(objeto);
    }

    return resultado;
}


// ============================================
// CARGAR INFORMACIÓN DE LAS LÍNEAS
// ============================================

async function cargarDatosMetrovalencia() {

    console.log("🚇 Cargando datos GTFS...");

    const [
        textoRoutes,
        textoTrips,
        textoShapes
    ] = await Promise.all([

        cargarArchivoGTFS("routes.txt"),
        cargarArchivoGTFS("trips.txt"),
        cargarArchivoGTFS("shapes.txt")

    ]);

    console.log("✅ routes.txt cargado");
    console.log("✅ trips.txt cargado");
    console.log("✅ shapes.txt cargado");


    const routes = analizarCSV(textoRoutes);
    const trips = analizarCSV(textoTrips);


    // ========================================
    // AGRUPAR RUTAS POR LÍNEA
    // ========================================

    const lineas = {};


    for (const route of routes) {

        const numeroLinea =
            route.route_short_name;

        if (!numeroLinea) {
            continue;
        }


        if (!lineas[numeroLinea]) {

            lineas[numeroLinea] = {

                nombre:
                    numeroLinea,

                color:
                    "#" +
                    route.route_color,

                routeIds: [],

                shapes: []

            };

        }


        lineas[numeroLinea]
            .routeIds
            .push(route.route_id);

    }


    // ========================================
    // OBTENER SHAPES DE CADA LÍNEA
    // ========================================

    for (const trip of trips) {

        const route =
            routes.find(
                r => r.route_id === trip.route_id
            );

        if (!route) {
            continue;
        }


        const numeroLinea =
            route.route_short_name;


        if (!lineas[numeroLinea]) {
            continue;
        }


        const shapeId =
            trip.shape_id;


        if (
            !lineas[numeroLinea]
                .shapes
                .includes(shapeId)
        ) {

            lineas[numeroLinea]
                .shapes
                .push(shapeId);

        }

    }


    // ========================================
    // ANALIZAR SHAPES
    // ========================================

    const shapes = analizarCSV(textoShapes);


    const shapesPorId = {};


    for (const punto of shapes) {

        const id =
            punto.shape_id;


        if (!shapesPorId[id]) {
            shapesPorId[id] = [];
        }


        shapesPorId[id].push({

            lat:
                parseFloat(
                    punto.shape_pt_lat
                ),

            lon:
                parseFloat(
                    punto.shape_pt_lon
                ),

            secuencia:
                parseInt(
                    punto.shape_pt_sequence
                )

        });

    }


    // ========================================
    // ORDENAR PUNTOS
    // ========================================

    for (const id in shapesPorId) {

        shapesPorId[id].sort(
            (a, b) =>
                a.secuencia -
                b.secuencia
        );

    }


    console.log(
        "🚇 Líneas encontradas:",
        lineas
    );


    return {

        lineas:
            lineas,

        shapes:
            shapesPorId

    };

}