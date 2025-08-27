let markers = [];
let polylines = {};
let map;

// GPS data fetching
async function fetchGPSData() {
    try {
        const res = await fetch('/api/gps');
        const data = await res.json();

        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        for (const id in polylines) {
            map.removeLayer(polylines[id]);
        }
        polylines = {};

        const deviceGroups = {};
        data.forEach(d => {
            if (!deviceGroups[d.device_id]) deviceGroups[d.device_id] = [];
            deviceGroups[d.device_id].push(d);
        });

        for (const id in deviceGroups) {
            const color = getColor(id);
            const points = deviceGroups[id];
            const latlngs = points.map(p => [p.lat, p.lon]);
            polylines[id] = L.polyline(latlngs, { color }).addTo(map);

            points.forEach(p => {
                const marker = L.circleMarker([p.lat, p.lon], {
                    radius: 6,
                    fillColor: color,
                    color: color,
                    weight: 1,
                    fillOpacity: 0.8
                }).bindPopup(`${id}<br>vor ${formatTimeAgo(p.timestamp)}`).addTo(map);
                markers.push(marker);
            });
        }

        updateLegend();

        if (data.length > 0) {
            const last = data[data.length - 1];
            if (document.getElementById('auto-center').checked) {
                map.panTo([last.lat, last.lon]);
            }
        }
    } catch (error) {
        console.error('Error fetching GPS data:', error);
    }
}



// Reset track
async function resetTrack() {
    try {
        const response = await fetch('/api/clear', {
            method: 'POST',
            headers: { 'Authorization': 'tQJxIjDs440Q' }
        });

        if (response.ok) {
            for (const id in polylines) map.removeLayer(polylines[id]);
            polylines = {};
            markers.forEach(m => map.removeLayer(m));
            markers = [];
            alert("GPS-Daten wurden gelöscht.");
        } else {
            alert("Fehler beim Löschen der Daten vom Server.");
        }
    } catch (error) {
        console.error('Error resetting track:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    initMap();
    if (typeof loadFields === 'function') {
        await loadFields();
    }
    if (typeof loadTasks === 'function') {
        await loadTasks();
    }
    if (typeof applyTaskStyles === 'function') {
        applyTaskStyles();
    }
    fetchGPSData();
    setInterval(fetchGPSData, 10000);
});


window.toggleDarkMode = function() {
    const btn = document.getElementById("darkmode-btn");
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        btn.textContent = "☀️ Tag";
    } else {
        btn.textContent = "🌙 Nacht";
    }
}

