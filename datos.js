// ============================================
// LECTOR GTFS - METROVALENCIA RADAR
// ============================================


// ============================================
// CARGAR ARCHIVO GTFS
// ============================================

async function cargarArchivoGTFS(nombre) {

    const respuesta =
        await fetch("gtfs/" + nombre);

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

    const lineas =
        texto.trim().split(/\r?\n/);

    const cabeceras =
        lineas[0].split(",");

    const resultado = [];


    for (
        let i = 1;
        i < lineas.length;
        i++
    ) {

        const columnas =
            lineas[i].split(",");

        const objeto = {};


        cabeceras.forEach(
            (cabecera, indice) => {

                objeto[cabecera] =
                    columnas[indice];

            }
        );


        resultado.push(objeto);

    }


    return resultado;

}


// ============================================
// CARGAR INFORMACIÓN DE METROVALENCIA
// ============================================

async function cargarDatosMetrovalencia() {

    console.log(
        "🚇 Cargando datos GTFS..."
    );


    // ========================================
    // CARGAR ARCHIVOS
    // ========================================

    const [

        textoRoutes,
        textoTrips,
        textoShapes,
        textoStops,
        textoStopTimes

    ] = await Promise.all([

        cargarArchivoGTFS(
            "routes.txt"
        ),

        cargarArchivoGTFS(
            "trips.txt"
        ),

        cargarArchivoGTFS(
            "shapes.txt"
        ),

        cargarArchivoGTFS(
            "stops.txt"
        ),

        cargarArchivoGTFS(
            "stop_times.txt"
        )

    ]);


    console.log(
        "✅ routes.txt cargado"
    );

    console.log(
        "✅ trips.txt cargado"
    );

    console.log(
        "✅ shapes.txt cargado"
    );

    console.log(
        "✅ stops.txt cargado"
    );

    console.log(
        "✅ stop_times.txt cargado"
    );


    // ========================================
    // ANALIZAR CSV
    // ========================================

    const routes =
        analizarCSV(textoRoutes);

    const trips =
        analizarCSV(textoTrips);

    const shapes =
        analizarCSV(textoShapes);

    const stops =
        analizarCSV(textoStops);

    const stopTimes =
        analizarCSV(textoStopTimes);


    console.log(
        "🚉 Paradas encontradas:",
        stops.length
    );

    console.log(
        "⏱️ Registros stop_times:",
        stopTimes.length
    );


    // ========================================
    // COLORES DE LAS LÍNEAS
    // ========================================

    const coloresMetrovalencia = {

        "1": "#FEC601",
        "2": "#FEC601",
        "3": "#E60096",
        "4": "#008C95",
        "5": "#E60096",
        "6": "#008C95",
        "7": "#E60096",
        "8": "#008C95",
        "9": "#FEC601",
        "10": "#E60096"

    };


    // ========================================
    // CREAR ÍNDICE DE RUTAS
    // ========================================

    const rutasPorId = {};


    for (const route of routes) {

        rutasPorId[
            route.route_id
        ] = route;

    }


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
                    coloresMetrovalencia[
                        numeroLinea
                    ] || "#666666",

                routeIds: [],

                shapes: []

            };

        }


        if (
            !lineas[numeroLinea]
                .routeIds
                .includes(route.route_id)
        ) {

            lineas[numeroLinea]
                .routeIds
                .push(route.route_id);

        }

    }


    // ========================================
    // CREAR ÍNDICE DE TRIPS
    // ========================================

    const viajesPorId = {};


    for (const trip of trips) {

        viajesPorId[
            trip.trip_id
        ] = trip;

    }


    // ========================================
    // OBTENER SHAPES DE CADA LÍNEA
    // ========================================

    for (const trip of trips) {

        const route =
            rutasPorId[
                trip.route_id
            ];


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
    // ORDENAR SHAPES
    // ========================================

    for (
        const id in shapesPorId
    ) {

        shapesPorId[id].sort(
            (a, b) =>
                a.secuencia -
                b.secuencia
        );

    }


    // ========================================
    // RELACIONAR ESTACIONES CON LÍNEAS
    // ========================================

    console.log(
        "🔗 Calculando líneas por estación..."
    );


    const estacionesLineas = {};


    // Crear todas las estaciones

    for (const stop of stops) {

        estacionesLineas[
            stop.stop_id
        ] = [];

    }


    // ========================================
    // RECORRER STOP_TIMES
    // ========================================

    for (
        const stopTime
        of stopTimes
    ) {

        const stopId =
            stopTime.stop_id;

        const tripId =
            stopTime.trip_id;


        // Buscar el viaje mediante
        // nuestro índice

        const trip =
            viajesPorId[tripId];


        if (!trip) {
            continue;
        }


        // Buscar la ruta

        const route =
            rutasPorId[
                trip.route_id
            ];


        if (!route) {
            continue;
        }


        const numeroLinea =
            route.route_short_name;


        if (!numeroLinea) {
            continue;
        }


        // Comprobar que existe
        // la estación

        if (
            !estacionesLineas[
                stopId
            ]
        ) {

            estacionesLineas[
                stopId
            ] = [];

        }


        // Añadir la línea si
        // todavía no existe

        if (
            !estacionesLineas[
                stopId
            ].includes(
                numeroLinea
            )
        ) {

            estacionesLineas[
                stopId
            ].push(
                numeroLinea
            );

        }

    }


    // ========================================
    // ORDENAR LÍNEAS DE CADA ESTACIÓN
    // ========================================

    for (
        const stopId
        in estacionesLineas
    ) {

        estacionesLineas[
            stopId
        ].sort(

            (a, b) =>
                parseInt(a) -
                parseInt(b)

        );

    }


    console.log(
        "🔗 Relación estaciones → líneas creada"
    );

// ========================================
// CREAR HORARIOS POR ESTACIÓN
// ========================================

console.log(
    "🕐 Calculando horarios por estación..."
);


// ========================================
// CONVERTIR HH:MM:SS A SEGUNDOS
// ========================================

function convertirHora(hora) {

    const partes =
        hora.split(":");


    return (

        parseInt(partes[0]) * 3600 +

        parseInt(partes[1]) * 60 +

        parseInt(partes[2])

    );

}


const horariosPorEstacion = {};


// ========================================
// RECORRER STOP_TIMES
// ========================================

for (const stopTime of stopTimes) {

    const stopId =
        stopTime.stop_id;

    const tripId =
        stopTime.trip_id;


    const trip =
        viajesPorId[tripId];


    if (!trip) {
        continue;
    }


    const route =
        rutasPorId[
            trip.route_id
        ];


    if (!route) {
        continue;
    }


    const numeroLinea =
        route.route_short_name;


    if (!numeroLinea) {
        continue;
    }


    if (
        !horariosPorEstacion[
            stopId
        ]
    ) {

        horariosPorEstacion[
            stopId
        ] = [];

    }


    horariosPorEstacion[
        stopId
    ].push({

        tripId:
            tripId,

        linea:
            numeroLinea,

        destino:
            trip.trip_headsign,

        llegada:
            stopTime.arrival_time,

        salida:
            stopTime.departure_time,

        secuencia:
            parseInt(
                stopTime.stop_sequence
            )

    });

}


// ========================================
// ORDENAR HORARIOS
// ========================================

for (
    const stopId
    in horariosPorEstacion
) {

    horariosPorEstacion[
        stopId
    ].sort(

        (a, b) => {

            return (
                convertirHora(
                    a.salida
                ) -
                convertirHora(
                    b.salida
                )
            );

        }

    );

}


console.log(
    "🕐 Horarios por estación creados:",
    horariosPorEstacion
);


    // ========================================
    // MOSTRAR INFORMACIÓN
    // ========================================

    console.log(
        "🚇 Líneas encontradas:",
        lineas
    );


    console.log(
        "🚉 Estaciones con líneas:",
        estacionesLineas
    );


    // ========================================
    // RESULTADO FINAL
    // ========================================

   return {

    lineas:
        lineas,

    shapes:
        shapesPorId,

    stops:
        stops,

    estacionesLineas:
        estacionesLineas,

    horariosPorEstacion:
        horariosPorEstacion

};

}