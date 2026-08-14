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