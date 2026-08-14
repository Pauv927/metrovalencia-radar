console.log("🚇 Metrovalencia Radar iniciado");


// ============================================
// CREAR MAPA
// ============================================

const mapa = L.map("mapa").setView(
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
// CARGAR SHAPE
// ============================================

cargarShapes()
    .then(texto => {

        console.log(
            "🔎 Buscando shape 74..."
        );

        const puntos =
            obtenerShape(texto, 74);

        console.log(
            "📍 Puntos encontrados:",
            puntos.length
        );


        // Convertir a formato Leaflet

        const coordenadas =
            puntos.map(punto => [
                punto.lat,
                punto.lon
            ]);


        // Dibujar línea

        const linea =
            L.polyline(
                coordenadas,
                {
                    color: "#E60096",
                    weight: 5,
                    opacity: 0.9
                }
            ).addTo(mapa);


        // Centrar el mapa en la línea

        mapa.fitBounds(
            linea.getBounds()
        );


        console.log(
            "🎉 ¡Shape dibujado!"
        );

        document.getElementById("estado").textContent =
            "Línea cargada";

    })
    .catch(error => {

        console.error(
            "❌ Error:",
            error
        );

        document.getElementById("estado").textContent =
            "Error cargando datos";

    });