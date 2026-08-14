// ============================================
// METROVALENCIA RADAR
// ============================================

console.log(
    "🚇 Metrovalencia Radar iniciado"
);


// ============================================
// MAPA
// ============================================

const mapa =
    L.map("mapa")
        .setView(
            [39.4699, -0.3763],
            11
        );


// ============================================
// OPENSTREETMAP
// ============================================

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:
            "&copy; OpenStreetMap contributors"
    }
).addTo(mapa);


// ============================================
// COLORES METROVALENCIA
// ============================================

const coloresMetrovalencia = {

    "1": "#FEC601",
    "2": "#E60096",
    "3": "#DD052C",
    "4": "#014A99",
    "5": "#008F71",
    "6": "#8884BF",
    "7": "#F28D01",
    "8": "#B8804F",
    "9": "#B7DD79",
    "10": "#B7DD79"

};


// ============================================
// CONVERTIR HH:MM:SS A SEGUNDOS
// ============================================

function convertirHoraSegundos(hora) {

    if (!hora) {
        return null;
    }


    const partes =
        hora.split(":");


    if (partes.length !== 3) {
        return null;
    }


    return (

        parseInt(partes[0]) * 3600 +

        parseInt(partes[1]) * 60 +

        parseInt(partes[2])

    );

}


// ============================================
// OBTENER HORA ACTUAL
// ============================================

function obtenerHoraActual() {

    const ahora =
        new Date();


    return (

        ahora.getHours() * 3600 +

        ahora.getMinutes() * 60 +

        ahora.getSeconds()

    );

}


// ============================================
// FORMATEAR HORA
// ============================================

function formatearHora(hora) {

    if (!hora) {
        return "--:--";
    }


    const partes =
        hora.split(":");


    let horas =
        parseInt(partes[0]);


    const minutos =
        partes[1];


    horas =
        horas % 24;


    return (

        String(horas)
            .padStart(2, "0")

        + ":" +

        minutos

    );

}


// ============================================
// FORMATEAR TIEMPO RESTANTE
// ============================================

function formatearTiempoRestante(segundos) {

    if (segundos < 0) {
        segundos = 0;
    }


    const minutos =
        Math.floor(
            segundos / 60
        );


    if (minutos === 0) {
        return "ahora";
    }


    if (minutos === 1) {
        return "1 min";
    }


    return (
        minutos +
        " min"
    );

}


// ============================================
// OBTENER PRÓXIMOS TRENES
// ============================================

function obtenerProximosTrenes(
    stopId,
    datos
) {

    const horarios =
        datos.horariosPorEstacion[
            stopId
        ] || [];


    if (horarios.length === 0) {
        return [];
    }


    const ahora =
        obtenerHoraActual();


    const trenes = [];


    // ========================================
    // EVITAR DUPLICADOS
    // ========================================

    const duplicados =
        new Set();


    // ========================================
    // BUSCAR SERVICIOS FUTUROS
    // ========================================

    for (
        const horario
        of horarios
    ) {

        const segundosSalida =
            convertirHoraSegundos(
                horario.salida
            );


        if (
            segundosSalida === null
        ) {

            continue;

        }


        let diferencia =
            segundosSalida -
            ahora;


        // ====================================
        // SERVICIOS DESPUÉS DE MEDIANOCHE
        // ====================================

        if (
            diferencia < 0 &&
            segundosSalida < 6 * 3600
        ) {

            diferencia +=
                24 * 3600;

        }


        // ====================================
        // IGNORAR TRENES PASADOS
        // ====================================

        if (
            diferencia < 0
        ) {

            continue;

        }


        // ====================================
        // CLAVE PARA ELIMINAR DUPLICADOS
        // ====================================

        const clave =
            horario.linea +
            "|" +
            horario.destino +
            "|" +
            horario.salida;


        if (
            duplicados.has(clave)
        ) {

            continue;

        }


        duplicados.add(
            clave
        );


        // ====================================
        // GUARDAR TREN
        // ====================================

        trenes.push({

            ...horario,

            segundosSalida:
                segundosSalida,

            diferencia:
                diferencia

        });

    }


    // ========================================
    // ORDENAR POR HORA
    // ========================================

    trenes.sort(

        (a, b) =>
            a.diferencia -
            b.diferencia

    );


    // ========================================
    // DEVOLVER LOS 5 PRÓXIMOS
    // ========================================

    return trenes.slice(
        0,
        5
    );

}


// ============================================
// CREAR HTML DE LOS PRÓXIMOS TRENES
// ============================================

function crearHTMLProximosTrenes(
    stopId,
    datos
) {

    const trenes =
        obtenerProximosTrenes(
            stopId,
            datos
        );


    if (
        trenes.length === 0
    ) {

        return `

            <div
                style="
                    color:#777;
                    margin-top:8px;
                "
            >
                No hay más trenes
                programados próximamente.
            </div>

        `;

    }


    let html = "";


    for (
        const tren
        of trenes
    ) {

        const color =
            coloresMetrovalencia[
                tren.linea
            ] ||
            "#666666";


        html += `

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:10px;
                    margin-top:7px;
                    padding:5px 0;
                    border-bottom:1px solid #eeeeee;
                "
            >

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:6px;
                    "
                >

                    <span
                        style="
                            background:${color};
                            color:#111;
                            font-weight:bold;
                            border-radius:5px;
                            padding:3px 6px;
                            min-width:30px;
                            text-align:center;
                        "
                    >
                        L${tren.linea}
                    </span>


                    <span>
                        → ${tren.destino}
                    </span>

                </div>


                <div
                    style="
                        text-align:right;
                        white-space:nowrap;
                    "
                >

                    <strong>
                        ${formatearHora(
                            tren.salida
                        )}
                    </strong>

                    <br>

                    <small
                        style="
                            color:#777;
                        "
                    >
                        ${formatearTiempoRestante(
                            tren.diferencia
                        )}
                    </small>

                </div>

            </div>

        `;

    }


    return html;

}


// ============================================
// ICONO DE ESTACIÓN
// ============================================

const iconoEstacion =
    L.divIcon({

        className:
            "icono-estacion-metrovalencia",

        html: `

            <img
                src="logo.png"
                style="
                    width:28px;
                    height:28px;
                    object-fit:contain;
                    display:block;
                "
            >

        `,

        iconSize:
            [28, 28],

        iconAnchor:
            [14, 14],

        popupAnchor:
            [0, -14]

    });


// ============================================
// DIBUJAR TODA LA RED
// ============================================

cargarDatosMetrovalencia()

    .then(datos => {


        console.log(
            "🎉 GTFS cargado correctamente"
        );


        const lineas =
            datos.lineas;


        const shapes =
            datos.shapes;


        // ====================================
        // DEBUG
        // ====================================

        console.log(
            "🔍 Shapes por línea:",
            lineas
        );


        let totalShapes = 0;


        // ====================================
        // RECORRER LÍNEAS
        // ====================================

        for (
            const numeroLinea in lineas
        ) {

            const linea =
                lineas[numeroLinea];


            console.log(
                "🚇 Dibujando L" +
                numeroLinea
            );


            // =================================
            // RECORRER SHAPES
            // =================================

            for (
                const shapeId
                of linea.shapes
            ) {

                const puntos =
                    shapes[shapeId];


                if (
                    !puntos ||
                    puntos.length < 2
                ) {

                    continue;

                }


                const coordenadas =
                    puntos.map(
                        punto => [

                            punto.lat,
                            punto.lon

                        ]
                    );


                // =============================
                // DIBUJAR
                // =============================

                L.polyline(

                    coordenadas,

                    {

                        color:
                            linea.color,

                        weight:
                            5,

                        opacity:
                            0.85

                    }

                ).addTo(mapa);


                totalShapes++;

            }

        }


        console.log(
            "🗺️ Shapes dibujados:",
            totalShapes
        );


        // ====================================
        // DIBUJAR ESTACIONES
        // ====================================

        console.log(
            "🚉 Dibujando estaciones..."
        );


        const estaciones =
            datos.stops;


        for (
            const estacion
            of estaciones
        ) {


            const lat =
                parseFloat(
                    estacion.stop_lat
                );


            const lon =
                parseFloat(
                    estacion.stop_lon
                );


            if (
                isNaN(lat) ||
                isNaN(lon)
            ) {

                continue;

            }


            // =================================
            // LÍNEAS DE LA ESTACIÓN
            // =================================

            const lineasEstacion =
                datos.estacionesLineas[
                    estacion.stop_id
                ] || [];


            let htmlLineas =
                "";


            for (
                const linea
                of lineasEstacion
            ) {

                const color =
                    coloresMetrovalencia[
                        linea
                    ] ||
                    "#666666";


                htmlLineas += `

                    <span
                        style="
                            display:inline-block;
                            padding:4px 7px;
                            margin:2px;
                            border-radius:5px;
                            background:${color};
                            color:#111;
                            font-weight:bold;
                        "
                    >
                        L${linea}
                    </span>

                `;

            }


            if (
                !htmlLineas
            ) {

                htmlLineas =
                    "<span>Sin información</span>";

            }


            // =================================
            // PRÓXIMOS TRENES
            // =================================

            const htmlTrenes =
                crearHTMLProximosTrenes(
                    estacion.stop_id,
                    datos
                );


            // =================================
            // POPUP
            // =================================

            const popup = `

                <div
                    style="
                        min-width:260px;
                    "
                >

                    <h3
                        style="
                            margin:0 0 10px 0;
                        "
                    >
                        🚉 ${estacion.stop_name}
                    </h3>


                    <div
                        style="
                            margin-bottom:12px;
                        "
                    >

                        <strong>
                            Líneas
                        </strong>

                        <br>

                        ${htmlLineas}

                    </div>


                    <div>

                        <strong>
                            🚆 Próximos trenes
                        </strong>

                        ${htmlTrenes}

                    </div>

                </div>

            `;


            // =================================
            // MARCADOR CON LOGO
            // =================================

            L.marker(

                [lat, lon],

                {

                    icon:
                        iconoEstacion

                }

            )

            .addTo(mapa)

            .bindTooltip(
                estacion.stop_name
            )

            .bindPopup(
                popup
            );

        }


        console.log(
            "🚉 Estaciones dibujadas:",
            estaciones.length
        );


        // ====================================
        // ESTADO
        // ====================================

        document
            .getElementById("estado")
            .textContent =
                "Red cargada";


    })


    .catch(error => {


        console.error(
            "❌ Error cargando GTFS:",
            error
        );


        document
            .getElementById("estado")
            .textContent =
                "Error";

    });