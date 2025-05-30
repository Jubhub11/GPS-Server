let fields = {};

async function loadFields() {
  try {
    const res = await fetch('/api/list-kml');
    const files = await res.json();

    for (const file of files) {
      const url = `/static/fields/${file}`;
      const response = await fetch(url);
      const kmlText = await response.text();
      const parser = new DOMParser();
      const kml = parser.parseFromString(kmlText, 'text/xml');
      const geojson = toGeoJSON.kml(kml);

      geojson.features.forEach((feature, index) => {
        const fieldId = feature.properties.name || `${file}-${index + 1}`;

        if (fields[fieldId]) {
          console.log(`Feld ${fieldId} existiert bereits und wird übersprungen`);
          return;
        }

        const field = L.geoJSON(feature, {
          style: {
            color: '#3388ff',
            fillColor: '#3388ff',
            weight: 2,
            opacity: 0.6,
            fillOpacity: 0.2
          }
        }).addTo(map);

        field.on('click', () => handleFieldClick(fieldId));

        fields[fieldId] = {
          layer: field,
          status: 'normal',
          name: fieldId,
          fileName: file,
          geojson: feature
        };
      });
    }

    updateLoadedFieldsList();
  } catch (error) {
    console.error('Fehler beim Laden der KML-Dateien vom Server:', error);
  }
}

function handleFieldClick(fieldId) {
  if (isCreatingTask) {
    const wasSelected = selectedFields.has(fieldId);
    if (wasSelected) {
      selectedFields.delete(fieldId);
      fields[fieldId].layer.setStyle({
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.2
      });
    } else {
      selectedFields.add(fieldId);
      fields[fieldId].layer.setStyle({
        color: '#ff3333',
        fillColor: '#ff3333',
        fillOpacity: 0.4
      });
    }
  }
}

function updateLoadedFieldsList() {
  const dropdown = document.getElementById('fields-dropdown');
  dropdown.innerHTML = '';
  
  Object.entries(fields).forEach(([fieldId, field]) => {
    const fieldEntry = document.createElement('div');
    fieldEntry.className = 'field-entry';
    fieldEntry.textContent = `${fieldId} (${field.fileName || 'Unbekannte Datei'})`;
    fieldEntry.onclick = () => {
      map.fitBounds(field.layer.getBounds());
    };
    dropdown.appendChild(fieldEntry);
  });
}

function toggleFieldsDropdown() {
  const dropdown = document.getElementById('fields-dropdown');
  dropdown.classList.toggle('show');
}

function applyTaskStyles() {
  tasks.forEach(task => {
    task.fields.forEach(field => {
      const fieldId = field.id;
      const isCompleted = field.completed;

      if (fields[fieldId]) {
        fields[fieldId].layer.setStyle({
          color: task.color,
          fillColor: task.color,
          weight: 2,
          opacity: 0.6,
          fillOpacity: isCompleted ? 0.4 : 0.2
        });
      }
    });
  });
}
