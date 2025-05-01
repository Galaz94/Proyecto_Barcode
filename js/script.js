  // --- Variables Globales y Selectores ---
  let usedCodes = JSON.parse(localStorage.getItem('usedCodes') || "[]");
  let scannedCodes = new Set(JSON.parse(localStorage.getItem('scannedCodes') || "[]"));
  let html5QrCode = null; // Renombrado para evitar conflicto con la clase
  let isScannerActive = false; // Flag para estado del escáner

  const infoMessageDiv = document.getElementById("info-message");
  const outputDiv = document.getElementById("output");
  const inputTextArea = document.getElementById("input");
  const savePdfBtn = document.getElementById('savePdf');
  const startScanBtn = document.getElementById('startScanBtn');
  const stopScanBtn = document.getElementById('stopScanBtn');
  const scannerContainer = document.getElementById('scanner-container');
  const readerDiv = document.getElementById('reader');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const searchContainerDiv = document.getElementById('search-container');

  // --- Funciones de Utilidad ---
  function displayInfoMessage(message, duration = 3500) { // Duración más corta
    infoMessageDiv.textContent = message;
    infoMessageDiv.style.opacity = '1'; // Asegurar visibilidad
    if (duration > 0) {
      setTimeout(() => {
          infoMessageDiv.style.opacity = '0'; // Desvanecer
          setTimeout(() => { infoMessageDiv.textContent = ""; }, 300); // Limpiar después de desvanecer
      }, duration);
    }
  }

  // --- Funciones Principales ---
  function generateBarcodes() {
    const rawInput = inputTextArea.value.trim();
    localStorage.setItem('barcodeInput', rawInput); // Guarda el input en localStorage
    outputDiv.innerHTML = "";
    savePdfBtn.style.display = rawInput ? "inline-block" : "none";
    searchContainerDiv.style.display = rawInput ? "flex" : "none"; // Mostrar buscador si hay input
    if (!rawInput) {
        infoMessageDiv.textContent = "";
        searchContainerDiv.style.display = "none"; // Ocultar si no hay input
        return;
    }

    // Filtra la entrada para mantener solo números
    const numericInput = rawInput.replace(/[^0-9\s\t\n]+/g, '');

    // Divide la entrada numérica por uno o más caracteres de espacio en blanco
    const originalCodes = numericInput.split(/\s+/).map(c => c.trim()).filter(Boolean);

    const uniqueCodesSet = new Set(originalCodes);
    const uniqueCodes = [...uniqueCodesSet];
    const duplicatesRemoved = originalCodes.length - uniqueCodes.length;

    if (duplicatesRemoved > 0 && !infoMessageDiv.textContent) {
      displayInfoMessage(`Se eliminaron ${duplicatesRemoved} duplicados.`, 4000);
    } else if (duplicatesRemoved === 0) {
        // infoMessageDiv.textContent = ""; // Evitar limpiar mensajes activos
    }

    uniqueCodes.forEach(code => {
      const div = document.createElement("div");
      div.className = "barcode-item";
      div.dataset.code = code;

      const isUsed = usedCodes.includes(code);
      if (isUsed) div.classList.add("used");

      const isScanned = scannedCodes.has(code);
      if (isScanned) {
        const topMarker = document.createElement("span");
        topMarker.className = 'scan-marker-icon';
        topMarker.title = 'Escaneado';
        topMarker.textContent = '📷';
        div.appendChild(topMarker);
      }

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      try {
        JsBarcode(svg, code, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true,
            margin: 5,
            fontSize: 11
        });
        div.appendChild(svg);

        if (isUsed) { // Si el código ya estaba usado, aplicar los cambios visuales
          svg.remove();
          div.innerHTML = `✅️ <i>${code}</i> ✅️`;
        }

        div.addEventListener("click", (event) => {
          if (event.target.closest('button') || event.target.closest('a') || event.target.closest('.scan-marker-icon')) return;

          const svgElement = div.querySelector('svg');
          if (svgElement) {
            svgElement.remove(); // Elimina el SVG del código de barras
            div.classList.add("used"); // Opcional: Puedes mantener la clase "used" para otro propósito si lo deseas
            div.innerHTML = `✅️ <i>${code}</i> ✅️`; // Muestra el valor numérico en itálicas con marcas
            updateUsedCodes(code, true); // Actualiza la lista de códigos usados
          } else {
            // Si ya se hizo clic antes y se reemplazó, puedes revertir si lo deseas
            div.innerHTML = '';
            const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            JsBarcode(newSvg, code, {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: true,
                margin: 5,
                fontSize: 11
            });
            const isScannedAgain = scannedCodes.has(code);
            if (isScannedAgain) {
                const topMarkerAgain = document.createElement("span");
                topMarkerAgain.className = 'scan-marker-icon';
                topMarkerAgain.title = 'Escaneado';
                topMarkerAgain.textContent = '📷';
                div.appendChild(topMarkerAgain);
            }
            div.appendChild(newSvg);
            div.classList.remove("used");
            updateUsedCodes(code, false);
          }
        });
        outputDiv.appendChild(div);
      } catch (e) {
          console.error(`Error generando código "${code}":`, e);
          const errorDiv = document.createElement("div");
          errorDiv.className = "barcode-error";
          errorDiv.textContent = `Error: Código "${code}" inválido.`;
          outputDiv.appendChild(errorDiv);
      }
    });
  }

  function clearInput() {
    inputTextArea.value = "";
    outputDiv.innerHTML = "";
    savePdfBtn.style.display = "none";
    infoMessageDiv.textContent = "";
    searchContainerDiv.style.display = "none"; // Ocultar buscador al limpiar
    localStorage.removeItem('barcodeInput'); // Limpiar input guardado
    if (isScannerActive) stopScanner(); // Detener escáner si está activo
  }

  function updateUsedCodes(code, isUsed) {
    const index = usedCodes.indexOf(code);
    if (isUsed) {
      if (index === -1) usedCodes.push(code);
    } else {
      if (index > -1) usedCodes.splice(index, 1);
    }
    localStorage.setItem('usedCodes', JSON.stringify(usedCodes));
  }

  function changeLayout() {
    outputDiv.className = (outputDiv.className === "list") ? "grid" : "list";
  }

  function removeUsedCodes() {
    if (usedCodes.length === 0) {
        displayInfoMessage("No hay códigos marcados como 'usados'.", 3000);
        return;
    }
    if (confirm(`¿Eliminar ${usedCodes.length} código(s) 'usado(s)' de la lista y memoria?`)) {
      // ***** MODIFICACIÓN AQUÍ TAMBIÉN *****
      // Usar la misma lógica de split para obtener los códigos actuales
      let currentCodes = inputTextArea.value.trim().split(/\s+/).map(c => c.trim()).filter(Boolean);
      // ***********************************
      let keptCodes = currentCodes.filter(code => !usedCodes.includes(code));
      inputTextArea.value = keptCodes.join("\n"); // Volver a juntar con saltos de línea para claridad
      const removedCount = usedCodes.length; // Guardar antes de limpiar
      usedCodes = [];
      localStorage.removeItem('usedCodes');
      generateBarcodes(); // Regenerar con los códigos restantes
      displayInfoMessage(`${removedCount} código(s) 'usado(s)' eliminado(s).`, 4000);
    }
