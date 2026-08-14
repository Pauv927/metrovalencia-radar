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
// FECHA ACTUAL EN ESPAÑA
// ============================================

function obtenerFechaHoy() {

    const ahora =
        new Date();


    const año =
        ahora.getFullYear();

    const mes =
        String(
            ahora.getMonth() + 1
        ).padStart(2, "0");

    const día =
        String(
            ahora.getDate()
        ).padStart(2, "0");


    return (
        año +
        mes +
        día
    );

}


// ============================================
// DÍA DE LA SEMANA
// ============================================

function obtenerDiaSemana() {

    const ahora =
        new Date();


    // JavaScript:
    // 0 = domingo
    // 1 = lunes
    // ...
    // 6 = sábado

    return ahora.getDay();

}


// ============================================
// COMPROBAR SERVICIOS ACTIVOS HOY
// ============================================

function calcularServiciosActivosHoy(
    calendar,
    calendarDates
) {

    const fechaHoy =
        obtenerFechaHoy();


    const diaSemana =
        obtenerDiaSemana();


    const camposDias = {

        0: "sunday",
        1: "monday",
        2: "tuesday",
        3: "wednesday",
        4: "thursday",
        5: "friday",
        6: "saturday"

    };


    const campoDia =
        camposDias[diaSemana];


    const serviciosActivos =
        new Set();


    // ========================================
    // CALENDAR.TXT
    // ========================================

    for (
        const servicio
        of calendar
    ) {

        const inicio =
            parseInt(
                servicio.start_date
            );

        const fin =
            parseInt(
                servicio.end_date
            );

        const hoy =
            parseInt(
                fechaHoy
            );


        if (
            hoy < inicio ||
            hoy > fin
        ) {

            continue;

        }


        if (
            servicio[campoDia] === "1"
        ) {

            serviciosActivos.add(
                servicio.service_id
            );

        }

    }


    // ========================================
    // CALENDAR_DATES.TXT
    // ========================================

    for (
        const excepcion
        of calendarDates
    ) {

        if (
            excepcion.date !==
            fechaHoy
        ) {

            continue;

        }


        const serviceId =
            excepcion.service_id;


        // 1 = servicio añadido

        if (
            excepcion.exception_type === "1"
        ) {

            serviciosActivos.add(
                serviceId
            );

        }


        // 2 = servicio eliminado

        if (
            excepcion.exception_type === "2"
        ) {

            serviciosActivos.delete(
                serviceId
            );

        }

    }


    console.log(
        "📅 Fecha actual:",
        fechaHoy
    );

    console.log(
        "📅 Servicios activos hoy:",
        serviciosActivos.size
    );


    return serviciosActivos;

}


// ============================================
// SERVICIOS AFECTADOS POR OBRAS
// ============================================

function filtrarViajesPorObras(
    trips,
    stopTimes,
    stops,
    rutasPorId
) {

    // Obras Alameda - Marítim:
    // 25/06/2026 - 30/08/2026
    //
    // Afectan al metro de L5 y L7.
    //
    // Estaciones cerradas:
    // Aragó
    // Amistat
    // Ayora
    // Marítim

    const cerradas =
        new Set([

            "Aragó",
            "Amistat",
            "Ayora",
            "Marítim"

        ]);


    const paradaPorId = {};


    for (
        const stop
        of stops
    ) {

        paradaPorId[
            stop.stop_id
        ] =
            stop;

    }


    // ========================================
    // OBTENER TRIPS DE L5/L7
    // QUE PASAN POR ESTACIONES CERRADAS
    // ========================================

    const tripsAEliminar =
        new Set();


    for (
        const stopTime
        of stopTimes
    ) {

        const trip =
            trips.find(
                t =>
                    t.trip_id ===
                    stopTime.trip_id
            );


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


        const linea =
            route.route_short_name;


        if (
            linea !== "5" &&
            linea !== "7"
        ) {

            continue;

        }


        const stop =
            paradaPorId[
                stopTime.stop_id
            ];


        if (!stop) {
            continue;
        }


        if (
            cerradas.has(
                stop.stop_name
            )
        ) {

            tripsAEliminar.add(
                trip.trip_id
            );

        }

    }


    const resultado =
        trips.filter(

            trip =>
                !tripsAEliminar.has(
                    trip.trip_id
                )

        );


    console.log(
        "🚧 Viajes eliminados por obras:",
        tripsAEliminar.size
    );


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
        textoStopTimes,
        textoCalendar,
        textoCalendarDates

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
        ),

        cargarArchivoGTFS(
            "calendar.txt"
        ),

        cargarArchivoGTFS(
            "calendar_dates.txt"
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

    console.log(
        "✅ calendar.txt cargado"
    );

    console.log(
        "✅ calendar_dates.txt cargado"
    );


    // ========================================
    // ANALIZAR CSV
    // ========================================

    const routes =
        analizarCSV(textoRoutes);

    let trips =
        analizarCSV(textoTrips);

    const shapes =
        analizarCSV(textoShapes);

    const stops =
        analizarCSV(textoStops);

    let stopTimes =
        analizarCSV(textoStopTimes);

    const calendar =
        analizarCSV(textoCalendar);

    const calendarDates =
        analizarCSV(textoCalendarDates);


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

        "1":  "#FEC601",
        "2":  "#E60096",
        "3":  "#DD052C",
        "4":  "#014A99",
        "5":  "#008F71",
        "6":  "#8884BF",
        "7":  "#F28D01",
        "8":  "#3EB0CB",
        "9":  "#B8804F",
        "10": "#B7DD79"

    };


    // ========================================
    // SERVICIOS ACTIVOS HOY
    // ========================================

    const serviciosActivos =
        calcularServiciosActivosHoy(
            calendar,
            calendarDates
        );


    // ========================================
    // FILTRAR TRIPS POR CALENDARIO
    // ========================================

    const tripsOriginales =
        trips.length;


    trips =
        trips.filter(

            trip =>
                serviciosActivos.has(
                    trip.service_id
                )

        );


    console.log(
        "📅 Viajes por calendario:",
        tripsOriginales,
        "→",
        trips.length
    );


    // ========================================
    // CREAR ÍNDICE DE RUTAS
    // ========================================

    const rutasPorId = {};


    for (
        const route
        of routes
    ) {

        rutasPorId[
            route.route_id
        ] =
            route;

    }


    // ========================================
    // FILTRAR VIAJES AFECTADOS POR OBRAS
    // ========================================

    trips =
        filtrarViajesPorObras(
            trips,
            stopTimes,
            stops,
            rutasPorId
        );


    const tripsValidos =
        new Set(

            trips.map(
                trip =>
                    trip.trip_id
            )

        );


    // ========================================
    // FILTRAR STOP_TIMES
    // PARA QUEDARNOS SOLO
    // CON VIAJES VÁLIDOS
    // ========================================

    stopTimes =
        stopTimes.filter(

            stopTime =>
                tripsValidos.has(
                    stopTime.trip_id
                )

        );


    console.log(
        "🚆 Viajes válidos finales:",
        trips.length
    );

    console.log(
        "⏱️ Stop_times válidos:",
        stopTimes.length
    );


    // ========================================
    // AGRUPAR RUTAS POR LÍNEA
    // ========================================

    const lineas = {};


    for (
        const route
        of routes
    ) {

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
                    ] ||
                    "#666666",

                routeIds: [],

                shapes: []

            };

        }


        if (
            !lineas[numeroLinea]
                .routeIds
                .includes(
                    route.route_id
                )
        ) {

            lineas[numeroLinea]
                .routeIds
                .push(
                    route.route_id
                );

        }

    }


    // ========================================
    // ÍNDICE DE VIAJES
    // ========================================

    const viajesPorId = {};


    for (
        const trip
        of trips
    ) {

        viajesPorId[
            trip.trip_id
        ] =
            trip;

    }


    // ========================================
    // ÍNDICE DE ESTACIONES
    // ========================================

    const paradasPorId = {};


    for (
        const stop
        of stops
    ) {

        paradasPorId[
            stop.stop_id
        ] =
            stop;

    }


    // ========================================
    // OBTENER SHAPES DE CADA LÍNEA
    // ========================================

    console.log(
        "🛤️ Analizando recorridos..."
    );


    for (
        const trip
        of trips
    ) {

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


        if (!shapeId) {
            continue;
        }


        if (
            !lineas[numeroLinea]
                .shapes
                .includes(
                    shapeId
                )
        ) {

            lineas[numeroLinea]
                .shapes
                .push(
                    shapeId
                );

        }

    }


    // ========================================
    // ANALIZAR SHAPES
    // ========================================

    const shapesPorId = {};


    for (
        const punto
        of shapes
    ) {

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
        const id
        in shapesPorId
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


    for (
        const stop
        of stops
    ) {

        estacionesLineas[
            stop.stop_id
        ] = [];

    }


    for (
        const stopTime
        of stopTimes
    ) {

        const stopId =
            stopTime.stop_id;

        const tripId =
            stopTime.trip_id;


        const trip =
            viajesPorId[
                tripId
            ];


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
            !estacionesLineas[
                stopId
            ]
        ) {

            estacionesLineas[
                stopId
            ] = [];

        }


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


    function convertirHora(hora) {

        if (!hora) {
            return 0;
        }


        const partes =
            hora.split(":");


        return (

            parseInt(partes[0]) *
            3600 +

            parseInt(partes[1]) *
            60 +

            parseInt(partes[2])

        );

    }


    const horariosPorEstacion = {};


    for (
        const stopTime
        of stopTimes
    ) {

        const stopId =
            stopTime.stop_id;

        const tripId =
            stopTime.trip_id;


        const trip =
            viajesPorId[
                tripId
            ];


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

            (a, b) =>
                convertirHora(
                    a.salida
                ) -
                convertirHora(
                    b.salida
                )

        );

    }


    console.log(
        "🕐 Horarios por estación creados:",
        horariosPorEstacion
    );


    // ========================================
    // CREAR HORARIOS POR VIAJE
    // ========================================

    console.log(
        "🚆 Preparando recorridos de los trenes..."
    );


    const paradasPorViaje = {};


    for (
        const stopTime
        of stopTimes
    ) {

        const tripId =
            stopTime.trip_id;


        if (
            !paradasPorViaje[
                tripId
            ]
        ) {

            paradasPorViaje[
                tripId
            ] = [];

        }


        paradasPorViaje[
            tripId
        ].push({

            stopId:
                stopTime.stop_id,

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
    // ORDENAR PARADAS DE CADA VIAJE
    // ========================================

    for (
        const tripId
        in paradasPorViaje
    ) {

        paradasPorViaje[
            tripId
        ].sort(

            (a, b) =>
                a.secuencia -
                b.secuencia

        );

    }


    console.log(
        "🚆 Viajes preparados:",
        Object.keys(
            paradasPorViaje
        ).length
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

        paradasPorId:
            paradasPorId,

        rutasPorId:
            rutasPorId,

        viajesPorId:
            viajesPorId,

        estacionesLineas:
            estacionesLineas,

        horariosPorEstacion:
            horariosPorEstacion,

        paradasPorViaje:
            paradasPorViaje,

        colores:
            coloresMetrovalencia

    };

}