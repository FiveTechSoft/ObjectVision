/* ============================================================
   Borland ObjectVision — recreación web
   Diseñador visual de formularios estilo Borland (1992)
   ============================================================ */
"use strict";

/* ---------------- Estado global ---------------- */
const state = {
  mode: "design",        // "design" | "run"
  tool: null,            // herramienta activa de la paleta
  controls: [],          // objetos del formulario
  selectedId: null,
  counter: {},
  zTop: 1,
};

const canvas = document.getElementById("formCanvas");
const stMode = document.getElementById("stMode");
const stSel  = document.getElementById("stSel");
const stPos  = document.getElementById("stPos");
const stMsg  = document.getElementById("stMsg");
const inspProps  = document.getElementById("inspectorProps");
const inspEvents = document.getElementById("inspectorEvents");
const inspTarget = document.getElementById("inspectorTarget");

/* ---------------- Definición de la paleta ---------------- */
const PALETTE = [
  { type: "label",    ico: "Aᴀ",  name: "Etiqueta" },
  { type: "edit",     ico: "✎",   name: "Campo" },
  { type: "button",   ico: "▭",   name: "Botón" },
  { type: "checkbox", ico: "☑",   name: "Casilla" },
  { type: "radio",    ico: "◉",   name: "Radio" },
  { type: "listbox",  ico: "☰",   name: "Lista" },
  { type: "groupbox", ico: "⬚",   name: "Grupo" },
  { type: "panel",    ico: "▦",   name: "Panel" },
];

const TYPE_NAMES = Object.fromEntries(PALETTE.map(p => [p.type, p.name]));

function defaultsFor(type) {
  const base = {
    id: null, type,
    name: "", left: 10, top: 10, width: 90, height: 24,
    color: "#000000", fontSize: 11,
    events: { OnClick: { action: "none", message: "" },
              OnChange: { action: "none", message: "" } },
  };
  switch (type) {
    case "label":    return { ...base, caption: "Etiqueta1", width: 80, height: 18 };
    case "edit":     return { ...base, text: "", width: 120, height: 22, bgColor: "#ffffff" };
    case "button":   return { ...base, caption: "Botón1", width: 80, height: 26 };
    case "checkbox": return { ...base, caption: "Casilla1", width: 110, height: 18, checked: false };
    case "radio":    return { ...base, caption: "Opción1", width: 110, height: 18, checked: false, group: "Grupo1" };
    case "listbox":  return { ...base, items: "Elemento 1,Elemento 2,Elemento 3", width: 120, height: 80 };
    case "groupbox": return { ...base, caption: "Grupo1", width: 180, height: 110 };
    case "panel":    return { ...base, width: 150, height: 90, bgColor: "#c0c0c0" };
  }
}

/* ---------------- Paleta UI ---------------- */
const paletteEl = document.getElementById("palette");
PALETTE.forEach(p => {
  const b = document.createElement("button");
  b.className = "pal-btn";
  b.dataset.type = p.type;
  b.innerHTML = `<span class="ico">${p.ico}</span><span>${p.name}</span>`;
  b.addEventListener("click", () => {
    state.tool = state.tool === p.type ? null : p.type;
    document.querySelectorAll(".pal-btn").forEach(x =>
      x.classList.toggle("active", x.dataset.type === state.tool));
    msg(state.tool ? `Haga clic en el formulario para colocar: ${p.name}` : "Herramienta desactivada.");
    canvas.style.cursor = state.tool ? "crosshair" : "default";
  });
  paletteEl.appendChild(b);
});

/* ---------------- Creación de controles ---------------- */
function nextName(type) {
  state.counter[type] = (state.counter[type] || 0) + 1;
  return `${TYPE_NAMES[type]}${state.counter[type]}`;
}

function addControl(type, x, y) {
  const c = defaultsFor(type);
  c.id = "ctl" + Date.now() + Math.floor(Math.random() * 1000);
  c.name = nextName(type);
  c.left = Math.max(0, Math.round(x / 8) * 8);   // rejilla de 8px
  c.top  = Math.max(0, Math.round(y / 8) * 8);
  if (c.caption) c.caption = c.name;
  state.controls.push(c);
  renderControl(c);
  selectControl(c.id);
  msg(`${c.name} creado en (${c.left}, ${c.top}).`);
  return c;
}

/* ---------------- Render de un control ---------------- */
function renderControl(c) {
  const old = document.getElementById(c.id);
  if (old) old.remove();

  const el = document.createElement("div");
  el.id = c.id;
  el.className = "ov-control";
  el.dataset.type = c.type;
  el.style.left = c.left + "px";
  el.style.top = c.top + "px";
  el.style.width = c.width + "px";
  el.style.height = c.height + "px";
  el.style.zIndex = c.z || 1;

  switch (c.type) {
    case "label":
      el.classList.add("ov-label");
      el.textContent = c.caption;
      el.style.color = c.color;
      el.style.fontSize = c.fontSize + "px";
      break;
    case "button":
      el.classList.add("ov-button-ctl");
      el.textContent = c.caption;
      el.style.color = c.color;
      el.style.fontSize = c.fontSize + "px";
      break;
    case "edit": {
      el.classList.add("ov-edit-ctl");
      el.style.background = c.bgColor;
      const inp = document.createElement("input");
      inp.value = c.text;
      inp.readOnly = state.mode === "design";
      inp.style.color = c.color;
      inp.style.fontSize = c.fontSize + "px";
      inp.addEventListener("input", () => { c.text = inp.value; fireEvent(c, "OnChange"); });
      inp.addEventListener("pointerdown", e => { if (state.mode === "design") e.preventDefault(); e.stopPropagation(); });
      el.appendChild(inp);
      break;
    }
    case "checkbox": {
      el.classList.add("ov-check-ctl");
      el.style.fontSize = c.fontSize + "px";
      const box = document.createElement("span");
      box.className = "box";
      box.textContent = c.checked ? "✓" : "";
      const lab = document.createElement("span");
      lab.textContent = c.caption;
      lab.style.color = c.color;
      el.append(box, lab);
      break;
    }
    case "radio": {
      el.classList.add("ov-radio-ctl");
      el.style.fontSize = c.fontSize + "px";
      const box = document.createElement("span");
      box.className = "box" + (c.checked ? " on" : "");
      const lab = document.createElement("span");
      lab.textContent = c.caption;
      lab.style.color = c.color;
      el.append(box, lab);
      break;
    }
    case "listbox": {
      el.classList.add("ov-list-ctl");
      el.style.fontSize = c.fontSize + "px";
      (c.items || "").split(",").forEach((t, i) => {
        const li = document.createElement("div");
        li.className = "li" + (i === (c.selIndex ?? 0) ? " sel" : "");
        li.textContent = t.trim();
        li.style.color = c.color;
        li.addEventListener("click", e => {
          if (state.mode === "run") {
            e.stopPropagation();
            c.selIndex = i;
            el.querySelectorAll(".li").forEach(x => x.classList.remove("sel"));
            li.classList.add("sel");
            fireEvent(c, "OnChange");
          }
        });
        el.appendChild(li);
      });
      break;
    }
    case "groupbox":
      el.classList.add("ov-group-ctl");
      el.innerHTML = `<span class="gtitle" style="color:${c.color};font-size:${c.fontSize}px">${esc(c.caption)}</span>`;
      break;
    case "panel":
      el.classList.add("ov-panel-ctl");
      el.style.background = c.bgColor;
      break;
  }

  if (c.id === state.selectedId && state.mode === "design") markSelected(el);
  attachControlEvents(el, c);
  canvas.appendChild(el);
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
}

function renderAll() {
  canvas.querySelectorAll(".ov-control").forEach(e => e.remove());
  state.controls.forEach(renderControl);
}

/* ---------------- Interacción: colocar, seleccionar, arrastrar, redimensionar ---------------- */
function attachControlEvents(el, c) {
  el.addEventListener("pointerdown", e => {
    if (state.mode !== "design") { handleRunClick(c, e); return; }
    e.stopPropagation();
    selectControl(c.id);
    if (e.target.classList.contains("resize-handle")) {
      startResize(e, c);
    } else {
      startDrag(e, c, el);
    }
  });
}

canvas.addEventListener("pointerdown", e => {
  if (state.mode !== "design") return;
  if (e.target !== canvas) return;
  if (state.tool) {
    const r = canvas.getBoundingClientRect();
    addControl(state.tool, e.clientX - r.left, e.clientY - r.top);
  } else {
    selectControl(null);
  }
});

function startDrag(e, c, el) {
  const sx = e.clientX, sy = e.clientY;
  const ox = c.left, oy = c.top;
  const move = ev => {
    c.left = Math.max(0, Math.round((ox + ev.clientX - sx) / 4) * 4);
    c.top  = Math.max(0, Math.round((oy + ev.clientY - sy) / 4) * 4);
    el.style.left = c.left + "px";
    el.style.top = c.top + "px";
    updatePosStatus(c);
    refreshInspectorNumbers(c);
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function startResize(e, c) {
  const sx = e.clientX, sy = e.clientY;
  const ow = c.width, oh = c.height;
  const el = document.getElementById(c.id);
  const move = ev => {
    c.width  = Math.max(16, Math.round((ow + ev.clientX - sx) / 4) * 4);
    c.height = Math.max(12, Math.round((oh + ev.clientY - sy) / 4) * 4);
    el.style.width = c.width + "px";
    el.style.height = c.height + "px";
    refreshInspectorNumbers(c);
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function markSelected(el) {
  el.classList.add("selected");
  const h = document.createElement("div");
  h.className = "resize-handle";
  h.style.cssText = "position:absolute;right:-5px;bottom:-5px;width:8px;height:8px;background:#000080;border:1px solid #fff;cursor:nwse-resize;z-index:5;";
  el.appendChild(h);
}

/* ---------------- Selección ---------------- */
function selectControl(id) {
  state.selectedId = id;
  document.querySelectorAll(".ov-control.selected").forEach(e => {
    e.classList.remove("selected");
    e.querySelector(".resize-handle")?.remove();
  });
  if (id) {
    const el = document.getElementById(id);
    if (el && state.mode === "design") markSelected(el);
    const c = getControl(id);
    stSel.textContent = c ? `${c.name} : ${TYPE_NAMES[c.type]}` : "Sin selección";
    if (c) updatePosStatus(c);
  } else {
    stSel.textContent = "Sin selección";
  }
  buildInspector();
}

function getControl(id) { return state.controls.find(c => c.id === id); }
function updatePosStatus(c) { stPos.textContent = `X:${c.left} Y:${c.top}`; }
function msg(t) { stMsg.textContent = t; }

/* ---------------- Inspector de propiedades ---------------- */
const PROP_DEFS = {
  label:    ["name", "caption", "left", "top", "width", "height", "color", "fontSize"],
  button:   ["name", "caption", "left", "top", "width", "height", "color", "fontSize"],
  edit:     ["name", "text", "left", "top", "width", "height", "color", "bgColor", "fontSize"],
  checkbox: ["name", "caption", "checked", "left", "top", "width", "height", "color", "fontSize"],
  radio:    ["name", "caption", "checked", "group", "left", "top", "width", "height", "color", "fontSize"],
  listbox:  ["name", "items", "left", "top", "width", "height", "color", "fontSize"],
  groupbox: ["name", "caption", "left", "top", "width", "height", "color", "fontSize"],
  panel:    ["name", "left", "top", "width", "height", "bgColor"],
};

const PROP_LABELS = {
  name: "Nombre", caption: "Título", text: "Texto", left: "Izquierda", top: "Superior",
  width: "Ancho", height: "Alto", color: "Color", bgColor: "ColorFondo",
  fontSize: "Tamaño letra", checked: "Marcado", items: "Elementos", group: "Grupo",
};

function buildInspector() {
  const c = getControl(state.selectedId);
  inspProps.innerHTML = "";
  inspEvents.innerHTML = "";
  inspTarget.textContent = c ? c.name : "(nada)";

  if (!c) {
    inspProps.innerHTML = `<div class="insp-empty">Seleccione un objeto del formulario…</div>`;
    inspEvents.innerHTML = `<div class="insp-empty">Sin eventos disponibles.</div>`;
    return;
  }

  PROP_DEFS[c.type].forEach(key => {
    const row = document.createElement("div");
    row.className = "prop-row";
    const val = c[key];
    let input;
    if (key === "checked") {
      input = document.createElement("select");
      input.innerHTML = `<option value="true"${val ? " selected" : ""}>Verdadero</option><option value="false"${!val ? " selected" : ""}>Falso</option>`;
      input.addEventListener("change", () => { c.checked = input.value === "true"; rerender(c); });
    } else if (key === "color" || key === "bgColor") {
      input = document.createElement("input");
      input.type = "color";
      input.value = val;
      input.addEventListener("input", () => { c[key] = input.value; rerender(c); });
    } else if (["left", "top", "width", "height", "fontSize"].includes(key)) {
      input = document.createElement("input");
      input.type = "number";
      input.value = val;
      input.dataset.numprop = key;
      input.addEventListener("change", () => { c[key] = Math.max(0, parseInt(input.value) || 0); rerender(c); });
    } else {
      input = document.createElement("input");
      input.type = "text";
      input.value = val ?? "";
      input.addEventListener("change", () => {
        c[key] = input.value;
        if (key === "name") { inspTarget.textContent = c.name; stSel.textContent = `${c.name} : ${TYPE_NAMES[c.type]}`; }
        rerender(c);
      });
    }
    row.innerHTML = `<span class="prop-name">${PROP_LABELS[key] || key}</span>`;
    const wrap = document.createElement("span");
    wrap.className = "prop-val";
    wrap.appendChild(input);
    row.appendChild(wrap);
    inspProps.appendChild(row);
  });

  // Eventos
  Object.entries(c.events).forEach(([evName, ev]) => {
    const row = document.createElement("div");
    row.className = "ev-row";
    row.innerHTML = `<span class="ev-name"><span class="bolt">⚡</span> ${evName}</span>`;
    const wrap = document.createElement("span");
    wrap.className = "prop-val";
    const sel = document.createElement("select");
    sel.innerHTML = `
      <option value="none"${ev.action === "none" ? " selected" : ""}>(ninguna)</option>
      <option value="message"${ev.action === "message" ? " selected" : ""}>Mostrar mensaje</option>`;
    sel.addEventListener("change", () => {
      ev.action = sel.value;
      if (ev.action === "message") {
        const t = prompt("Texto del mensaje para " + evName + ":", ev.message || "¡Hola desde ObjectVision!");
        ev.message = t ?? ev.message;
      }
      buildInspector();
    });
    wrap.appendChild(sel);
    row.appendChild(wrap);
    inspEvents.appendChild(row);
    if (ev.action === "message" && ev.message) {
      const info = document.createElement("div");
      info.className = "prop-row";
      info.innerHTML = `<span class="prop-name"></span><span class="prop-val" style="color:#808080">«${esc(ev.message)}»</span>`;
      inspEvents.appendChild(info);
    }
  });
}

function refreshInspectorNumbers(c) {
  inspProps.querySelectorAll("input[data-numprop]").forEach(inp => {
    inp.value = c[inp.dataset.numprop];
  });
}

function rerender(c) {
  renderControl(c);
  if (c.id === state.selectedId) {
    const el = document.getElementById(c.id);
    if (el && state.mode === "design") markSelected(el);
  }
}

/* ---------------- Modo Ejecutar ---------------- */
function setMode(mode) {
  state.mode = mode;
  const running = mode === "run";
  canvas.classList.toggle("design", !running);
  canvas.classList.toggle("run", running);
  document.getElementById("btnRun").classList.toggle("pushed", running);
  document.getElementById("btnRun").textContent = running ? "■" : "▶";
  document.getElementById("formTitle").textContent = running ? "Form1 — Ejecutando" : "Form1 — Diseño";
  stMode.textContent = running ? "Ejecutar" : "Diseño";
  if (running) selectControl(null);
  canvas.style.cursor = !running && state.tool ? "crosshair" : "default";
  renderAll();
  msg(running ? "Aplicación en ejecución. Pulse ■ para volver al diseño." : "Modo diseño.");
}

function handleRunClick(c, e) {
  if (c.type === "checkbox") {
    c.checked = !c.checked;
    renderControl(c);
    fireEvent(c, "OnChange");
    fireEvent(c, "OnClick");
  } else if (c.type === "radio") {
    state.controls.forEach(o => {
      if (o.type === "radio" && o.group === c.group && o.checked) { o.checked = false; renderControl(o); }
    });
    c.checked = true;
    renderControl(c);
    fireEvent(c, "OnChange");
    fireEvent(c, "OnClick");
  } else if (c.type === "button") {
    fireEvent(c, "OnClick");
  }
}

function fireEvent(c, evName) {
  const ev = c.events[evName];
  if (ev && ev.action === "message") showRetroMessage(ev.message || "(mensaje vacío)", c.name);
}

/* ---------------- Cuadro de mensaje retro ---------------- */
function showRetroMessage(text, from) {
  const back = document.createElement("div");
  back.className = "modal-backdrop";
  back.innerHTML = `
    <div class="window dialog" style="width:300px">
      <div class="title-bar"><span class="title-text">${esc(from)} — ObjectVision</span></div>
      <div class="dialog-body"><p>ℹ️ ${esc(text)}</p></div>
      <div class="dialog-buttons"><button class="ov-button">Aceptar</button></div>
    </div>`;
  back.querySelector("button").addEventListener("click", () => back.remove());
  document.body.appendChild(back);
}

/* ---------------- Menús ---------------- */
const MENUS = {
  file: [
    { label: "Nuevo", shortcut: "Ctrl+N", action: clearForm },
    { label: "Abrir…", shortcut: "Ctrl+O", action: importJSON },
    { label: "Guardar", shortcut: "Ctrl+S", action: exportJSON },
    "sep",
    { label: "Salir", action: () => msg("¡Gracias por usar ObjectVision! (cierre la pestaña para salir)") },
  ],
  edit: [
    { label: "Eliminar objeto", shortcut: "Supr", action: deleteSelected },
    { label: "Limpiar formulario", action: clearForm },
    "sep",
    { label: "Traer al frente", action: () => reorderZ(1) },
    { label: "Enviar al fondo", action: () => reorderZ(-1) },
  ],
  view: [
    { label: "Modo diseño", action: () => setMode("design") },
    { label: "Modo ejecución", action: () => setMode("run") },
    "sep",
    { label: "Centrar ventanas", action: resetWindows },
  ],
  object: [
    ...PALETTE.map(p => ({ label: `Añadir ${p.name}`, action: () => addControl(p.type, 30 + Math.random() * 120, 30 + Math.random() * 120) })),
  ],
  run: [
    { label: "Ejecutar", shortcut: "F9", action: () => setMode("run") },
    { label: "Detener", shortcut: "Ctrl+F2", action: () => setMode("design") },
    "sep",
    { label: "Reiniciar valores", action: resetValues },
  ],
  help: [
    { label: "Acerca de ObjectVision…", action: () => toggleModal(true) },
  ],
};

const menuBar = document.getElementById("menuBar");
const dropdown = document.getElementById("dropdown");
let openMenu = null;

menuBar.querySelectorAll(".menu-item").forEach(mi => {
  mi.addEventListener("click", e => {
    e.stopPropagation();
    if (openMenu === mi.dataset.menu) return closeMenu();
    showMenu(mi);
  });
  mi.addEventListener("mouseenter", () => { if (openMenu && openMenu !== mi.dataset.menu) showMenu(mi); });
});

function showMenu(mi) {
  closeMenu();
  openMenu = mi.dataset.menu;
  mi.classList.add("open");
  dropdown.innerHTML = "";
  MENUS[openMenu].forEach(item => {
    if (item === "sep") {
      const s = document.createElement("div");
      s.className = "dd-sep";
      dropdown.appendChild(s);
    } else {
      const d = document.createElement("div");
      d.className = "dd-item";
      d.innerHTML = `<span>${item.label}</span><span class="shortcut">${item.shortcut || ""}</span>`;
      d.addEventListener("click", () => { closeMenu(); item.action(); });
      dropdown.appendChild(d);
    }
  });
  const r = mi.getBoundingClientRect();
  dropdown.style.left = r.left + "px";
  dropdown.style.top = r.bottom + "px";
  dropdown.classList.remove("hidden");
}

function closeMenu() {
  openMenu = null;
  dropdown.classList.add("hidden");
  menuBar.querySelectorAll(".menu-item").forEach(m => m.classList.remove("open"));
}
document.addEventListener("click", e => { if (!dropdown.contains(e.target)) closeMenu(); });

/* ---------------- Acciones ---------------- */
function deleteSelected() {
  if (!state.selectedId) return msg("No hay ningún objeto seleccionado.");
  const c = getControl(state.selectedId);
  state.controls = state.controls.filter(x => x.id !== state.selectedId);
  document.getElementById(state.selectedId)?.remove();
  msg(`${c.name} eliminado.`);
  selectControl(null);
}

function clearForm() {
  state.controls = [];
  state.selectedId = null;
  state.counter = {};
  renderAll();
  selectControl(null);
  msg("Formulario nuevo creado.");
}

function reorderZ(dir) {
  const c = getControl(state.selectedId);
  if (!c) return msg("Seleccione primero un objeto.");
  c.z = dir > 0 ? ++state.zTop : 0;
  renderControl(c);
  msg(dir > 0 ? `${c.name} traído al frente.` : `${c.name} enviado al fondo.`);
}

function resetValues() {
  state.controls.forEach(c => {
    if (c.type === "edit") c.text = "";
    if (c.type === "checkbox" || c.type === "radio") c.checked = false;
    if (c.type === "listbox") c.selIndex = 0;
  });
  renderAll();
  msg("Valores reiniciados.");
}

/* ---------------- Guardar / Abrir (JSON) ---------------- */
function exportJSON() {
  const data = { app: "ObjectVision Web", version: "2.0", form: "Form1", controls: state.controls };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "form1.ov.json";
  a.click();
  URL.revokeObjectURL(a.href);
  msg("Formulario guardado como form1.ov.json.");
}

function importJSON() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".json";
  inp.addEventListener("change", () => {
    const f = inp.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(rd.result);
        if (!Array.isArray(data.controls)) throw new Error("formato inválido");
        state.controls = data.controls;
        state.selectedId = null;
        state.counter = {};
        state.controls.forEach(c => {
          const m = c.name?.match(/(\d+)$/);
          if (m) state.counter[c.type] = Math.max(state.counter[c.type] || 0, +m[1]);
        });
        renderAll();
        selectControl(null);
        msg(`Formulario «${f.name}» cargado (${state.controls.length} objetos).`);
      } catch (err) {
        showRetroMessage("No se pudo abrir el archivo: " + err.message, "Error");
      }
    };
    rd.readAsText(f);
  });
  inp.click();
}

/* ---------------- Barra de herramientas ---------------- */
document.getElementById("btnNew").addEventListener("click", clearForm);
document.getElementById("btnSave").addEventListener("click", exportJSON);
document.getElementById("btnOpen").addEventListener("click", importJSON);
document.getElementById("btnCut").addEventListener("click", deleteSelected);
document.getElementById("btnClear").addEventListener("click", clearForm);
document.getElementById("btnRun").addEventListener("click", () => setMode(state.mode === "design" ? "run" : "design"));
document.getElementById("btnAbout").addEventListener("click", () => toggleModal(true));
document.getElementById("btnAboutOk").addEventListener("click", () => toggleModal(false));
document.getElementById("aboutModal").addEventListener("click", e => { if (e.target.id === "aboutModal") toggleModal(false); });

function toggleModal(show) {
  document.getElementById("aboutModal").classList.toggle("hidden", !show);
}

/* ---------------- Pestañas del inspector ---------------- */
document.querySelectorAll(".inspector-tabs .tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".inspector-tabs .tab").forEach(x => x.classList.toggle("active", x === t));
    inspProps.classList.toggle("hidden", t.dataset.tab !== "props");
    inspEvents.classList.toggle("hidden", t.dataset.tab !== "events");
  });
});

/* ---------------- Ventanas flotantes arrastrables ---------------- */
["formWindow", "paletteWindow", "inspectorWindow"].forEach(id => {
  const win = document.getElementById(id);
  const bar = win.querySelector(".title-bar");
  bar.addEventListener("pointerdown", e => {
    const area = document.getElementById("mdiArea").getBoundingClientRect();
    const wr = win.getBoundingClientRect();
    const dx = e.clientX - wr.left, dy = e.clientY - wr.top;
    win.style.zIndex = ++state.zTop + 20;
    const move = ev => {
      win.style.left = Math.min(Math.max(0, ev.clientX - area.left - dx), area.width - 60) + "px";
      win.style.top  = Math.min(Math.max(0, ev.clientY - area.top - dy), area.height - 30) + "px";
      win.style.right = "auto";
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
});

function resetWindows() {
  const f = document.getElementById("formWindow");
  f.style.left = "16px"; f.style.top = "16px";
  const p = document.getElementById("paletteWindow");
  p.style.left = "auto"; p.style.right = "16px"; p.style.top = "16px";
  const i = document.getElementById("inspectorWindow");
  i.style.left = "auto"; i.style.right = "16px"; i.style.top = "290px";
  msg("Ventanas reordenadas.");
}

/* ---------------- Teclado ---------------- */
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
  if (e.key === "Delete") deleteSelected();
  if (e.key === "F9") setMode(state.mode === "design" ? "run" : "design");
  if (e.key === "Escape") { closeMenu(); toggleModal(false); }
  if (e.ctrlKey && e.key.toLowerCase() === "s") { e.preventDefault(); exportJSON(); }
  if (e.ctrlKey && e.key.toLowerCase() === "o") { e.preventDefault(); importJSON(); }
  if (e.ctrlKey && e.key.toLowerCase() === "n") { e.preventDefault(); clearForm(); }
  // Mover selección con flechas
  const c = getControl(state.selectedId);
  if (c && state.mode === "design" && e.key.startsWith("Arrow")) {
    e.preventDefault();
    const step = e.shiftKey ? 8 : 1;
    if (e.key === "ArrowLeft")  c.left = Math.max(0, c.left - step);
    if (e.key === "ArrowRight") c.left += step;
    if (e.key === "ArrowUp")    c.top = Math.max(0, c.top - step);
    if (e.key === "ArrowDown")  c.top += step;
    const el = document.getElementById(c.id);
    el.style.left = c.left + "px";
    el.style.top = c.top + "px";
    updatePosStatus(c);
    refreshInspectorNumbers(c);
  }
});

/* ---------------- Posición del ratón en la barra de estado ---------------- */
canvas.addEventListener("pointermove", e => {
  if (state.mode !== "design") return;
  const r = canvas.getBoundingClientRect();
  if (!state.selectedId) stPos.textContent = `X:${Math.round(e.clientX - r.left)} Y:${Math.round(e.clientY - r.top)}`;
});

/* ---------------- Ejemplo inicial ---------------- */
(function seed() {
  const g = addControl("groupbox", 24, 20); g.caption = "Datos del cliente"; g.width = 300; g.height = 150;
  const l1 = addControl("label", 44, 56);  l1.caption = "Nombre:";
  const e1 = addControl("edit", 120, 52);  e1.width = 180;
  const l2 = addControl("label", 44, 92);  l2.caption = "Ciudad:";
  const e2 = addControl("edit", 120, 88);  e2.width = 180;
  const cb = addControl("checkbox", 44, 124); cb.caption = "Cliente preferente";
  const lb = addControl("listbox", 350, 20); lb.items = "Pedido #1001,Pedido #1002,Pedido #1003,Pedido #1004";
  const b1 = addControl("button", 120, 200); b1.caption = "Aceptar";
  b1.events.OnClick = { action: "message", message: "¡Pedido registrado correctamente!" };
  const b2 = addControl("button", 220, 200); b2.caption = "Cancelar";
  b2.events.OnClick = { action: "message", message: "Operación cancelada." };
  selectControl(null);
  msg("Borland ObjectVision 2.0 — Formulario de ejemplo cargado. ¡Elija una herramienta de la paleta!");
})();
