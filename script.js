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

console.log("🚉 Dibujando estaciones...");

const estaciones = datos.stops;

for (const estacion of estaciones) {

    const lat = parseFloat(estacion.stop_lat);
    const lon = parseFloat(estacion.stop_lon);

    if (
        isNaN(lat) ||
        isNaN(lon)
    ) {
        continue;
    }

    const lineasEstacion =
    datos.estacionesLineas[
        estacion.stop_id
    ] || [];


const colores = {

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


let htmlLineas = "";


for (
    const linea
    of lineasEstacion
) {

    const color =
        colores[linea] ||
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


if (!htmlLineas) {

    htmlLineas =
        "<span>Sin información</span>";

}


const popup = `

    <div
        style="
            min-width:180px;
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
                margin-bottom:10px;
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

            <br>

            <span
                style="
                    color:#777;
                "
            >
                Próximamente...
            </span>

        </div>

    </div>

`;


L.circleMarker(
    [lat, lon],
    {

        radius: 5,

        color: "#ffffff",

        weight: 2,

        fillColor: "#181818",

        fillOpacity: 1

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