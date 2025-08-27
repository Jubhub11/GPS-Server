let fields = {};  // { fieldId: { layer, status, name, fileName, geojson } }

/*
loadFields - Lädt KML-Dateien vom Server, konvertiert sie in GeoJSON und fügt sie der Karte hinzu.
Verwendet die toGeoJSON-Bibliothek zur Konvertierung.
*/
// fields.js
async function loadFields() {
  try {
    const res = await fetch('/api/get-fields');
    const fieldsData = await res.json();

    for (const fieldId in fieldsData) {
      const fieldInfo = fieldsData[fieldId];
      const geojson = fieldInfo.geojson;

      const field = L.geoJSON(geojson, {
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
        name: fieldInfo.name,
        fileName: fieldInfo.fileName,
        geojson: geojson
      };
    }

    updateLoadedFieldsList();
  } catch (error) {
    console.error('Fehler beim Laden der Felder aus der Datenbank:', error);
  }
}

    updateLoadedFieldsList(); // Aktualisiert die Liste der geladenen Felder im Dropdown-Menü
  } catch (error) {
    console.error('Fehler beim Laden der KML-Dateien vom Server:', error);
  }
}

// Handhabt Klicks auf Felder zur Auswahl/Deselektion während der Aufgabenerstellung
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

// Aktualisiert die Liste der geladenen Felder im Dropdown-Menü
function updateLoadedFieldsList() {
  const dropdown = document.getElementById('fields-dropdown');
  dropdown.innerHTML = '';
  
  Object.entries(fields).forEach(([fieldId, field]) => {
    const fieldEntry = document.createElement('div');
    fieldEntry.className = 'field-entry';
    fieldEntry.textContent = `${fieldId} (${field.fileName || 'Unbekannte Datei'})`;
    fieldEntry.onclick = () => {
      map.fitBounds(field.layer.getBounds()); //zoomt auf das Feld
    };
    dropdown.appendChild(fieldEntry);
  });
}

// Zeigt oder versteckt das Dropdown-Menü für die Felder
function toggleFieldsDropdown() {
  const dropdown = document.getElementById('fields-dropdown');
  dropdown.classList.toggle('show');
}

// Wendet Stile auf Felder basierend auf dem Status der Aufgaben an
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
