/* ============================================================
   Borland ObjectVision — recreación web mejorada
   Diseñador visual de formularios estilo Borland (1992)
   v2.1 – Enhanced Edition con más controles y funcionalidades
   ============================================================ */
"use strict";

/* ==================== ESTADO GLOBAL ==================== */
const state = {
  mode: "design",        // "design" | "run"
  tool: null,            // herramienta activa de la paleta
  controls: [],          // objetos del formulario
  selectedId: null,
  counter: {},
  zTop: 1,
  clipboard: null,       // para copiar/pegar
  history: [],           // deshacer/rehacer
  historyIndex: -1,
};

const canvas = document.getElementById("formCanvas");
const stMode = document.getElementById("stMode");
const stSel  = document.getElementById("stSel");
const stPos  = document.getElementById("stPos");
const stMsg  = document.getElementById("stMsg");
const inspProps  = document.getElementById("inspectorProps");
const inspEvents = document.getElementById("inspectorEvents");
const inspTarget = document.getElementById("inspectorTarget");

/* ==================== PALETA EXTENDIDA ==================== */
const PALETTE = [
  { type: "label",      ico: "Aᴀ",  name: "Etiqueta" },
  { type: "edit",       ico: "✎",   name: "Campo texto" },
  { type: "button",     ico: "▭",   name: "Botón" },
  { type: "checkbox",   ico: "☑",   name: "Casilla" },
  { type: "radio",      ico: "◉",   name: "Radio" },
  { type: "listbox",    ico: "☰",   name: "Lista" },
  { type: "combobox",   ico: "▾",   name: "ComboBox" },
  { type: "spinner",    ico: "⬍",   name: "Spinner" },
  { type: "datepicker", ico: "📅",  name: "Fecha" },
  { type: "groupbox",   ico: "⬚",   name: "Grupo" },
  { type: "panel",      ico: "▦",   name: "Panel" },
  { type: "textarea",   ico: "📝",  name: "Área texto" },
];

const TYPE_NAMES = Object.fromEntries(PALETTE.map(p => [p.type, p.name]));

/* ==================== DEFINICIONES POR TIPO ==================== */
function defaultsFor(type) {
  const base = {
    id: null, type,
    name: "", left: 10, top: 10, width: 90, height: 24,
    color: "#000000", fontSize: 11,
    events: { 
      OnClick: { action: "none", message: "" },
      OnChange: { action: "none", message: "" },
      OnFocus: { action: "none", message: "" },
      OnBlur: { action: "none", message: "" },
    },
    visible: true,
    enabled: true,
  };
  
  switch (type) {
    case "label":
      return { ...base, caption: "Etiqueta1", width: 80, height: 18 };
    case "edit":
      return { ...base, text: "", width: 120, height: 22, bgColor: "#ffffff", placeholder: "Ingrese texto..." };
    case "button":
      return { ...base, caption: "Botón1", width: 80, height: 26 };
    case "checkbox":
      return { ...base, caption: "Casilla1", width: 110, height: 18, checked: false };
    case "radio":
      return { ...base, caption: "Opción1", width: 110, height: 18, checked: false, group: "Grupo1" };
    case "listbox":
      return { ...base, items: "Elemento 1,Elemento 2,Elemento 3", width: 120, height: 80, selIndex: 0 };
    case "combobox":
      return { ...base, items: "Opción 1,Opción 2,Opción 3", width: 120, height: 24, selIndex: 0, editable: false };
    case "spinner":
      return { ...base, value: 0, minValue: 0, maxValue: 100, step: 1, width: 80, height: 24 };
    case "datepicker":
      return { ...base, value: new Date().toISOString().split('T')[0], format: "DD/MM/YYYY", width: 120, height: 24 };
    case "textarea":
      return { ...base, text: "", width: 200, height: 100, bgColor: "#ffffff", rows: 4, cols: 30 };
    case "groupbox":
      return { ...base, caption: "Grupo1", width: 180, height: 110 };
    case "panel":
      return { ...base, width: 150, height: 90, bgColor: "#c0c0c0", borderStyle: "solid" };
  }
}

/* ==================== GESTOR DE HISTORIAL ==================== */
function pushHistory() {
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(JSON.parse(JSON.stringify(state.controls)));
  state.historyIndex++;
  if (state.history.length > 20) state.history.shift();
}

function undo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    state.controls = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
    renderAll();
    selectControl(null);
    msg("Deshacer.");
  }
}

function redo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    state.controls = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
    renderAll();
    selectControl(null);
    msg("Rehacer.");
  }
}

/* ==================== PALETA UI ==================== */
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

/* ==================== CREACIÓN DE CONTROLES ==================== */
function nextName(type) {
  state.counter[type] = (state.counter[type] || 0) + 1;
  return `${TYPE_NAMES[type]}${state.counter[type]}`;
}

function addControl(type, x, y) {
  const c = defaultsFor(type);
  c.id = "ctl" + Date.now() + Math.floor(Math.random() * 1000);
  c.name = nextName(type);
  c.left = Math.max(0, Math.round(x / 8) * 8);
  c.top  = Math.max(0, Math.round(y / 8) * 8);
  if (c.caption) c.caption = c.name;
  
  state.controls.push(c);
  pushHistory();
  renderControl(c);
  selectControl(c.id);
  msg(`${c.name} creado en (${c.left}, ${c.top}).`);
  return c;
}

/* ==================== RENDER DE CONTROLES ==================== */
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
  el.style.opacity = c.visible ? 1 : 0.5;
  el.style.pointerEvents = c.enabled ? "auto" : "none";

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
      inp.type = "text";
      inp.value = c.text;
      inp.placeholder = c.placeholder || "";
      inp.readOnly = state.mode === "design";
      inp.style.color = c.color;
      inp.style.fontSize = c.fontSize + "px";
      inp.addEventListener("input", () => { c.text = inp.value; fireEvent(c, "OnChange"); });
      inp.addEventListener("focus", () => fireEvent(c, "OnFocus"));
      inp.addEventListener("blur", () => fireEvent(c, "OnBlur"));
      inp.addEventListener("pointerdown", e => { if (state.mode === "design") e.preventDefault(); e.stopPropagation(); });
      el.appendChild(inp);
      break;
    }
    
    case "textarea": {
      el.classList.add("ov-textarea-ctl");
      el.style.background = c.bgColor;
      const ta = document.createElement("textarea");
      ta.value = c.text;
      ta.readOnly = state.mode === "design";
      ta.rows = c.rows || 4;
      ta.cols = c.cols || 30;
      ta.style.color = c.color;
      ta.style.fontSize = c.fontSize + "px";
      ta.style.width = "100%";
      ta.style.height = "100%";
      ta.style.border = "none";
      ta.style.padding = "2px";
      ta.addEventListener("input", () => { c.text = ta.value; fireEvent(c, "OnChange"); });
      ta.addEventListener("pointerdown", e => { if (state.mode === "design") e.preventDefault(); e.stopPropagation(); });
      el.appendChild(ta);
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
      if (state.mode === "run") {
        el.style.cursor = "pointer";
        el.addEventListener("click", e => {
          e.stopPropagation();
          c.checked = !c.checked;
          renderControl(c);
          fireEvent(c, "OnChange");
          fireEvent(c, "OnClick");
        });
      }
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
      if (state.mode === "run") {
        el.style.cursor = "pointer";
        el.addEventListener("click", e => {
          e.stopPropagation();
          state.controls.forEach(o => {
            if (o.type === "radio" && o.group === c.group && o.checked) {
              o.checked = false;
              renderControl(o);
            }
          });
          c.checked = true;
          renderControl(c);
          fireEvent(c, "OnChange");
          fireEvent(c, "OnClick");
        });
      }
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
        if (state.mode === "run") {
          li.style.cursor = "pointer";
          li.addEventListener("click", e => {
            e.stopPropagation();
            c.selIndex = i;
            el.querySelectorAll(".li").forEach(x => x.classList.remove("sel"));
            li.classList.add("sel");
            fireEvent(c, "OnChange");
            fireEvent(c, "OnClick");
          });
        }
        el.appendChild(li);
      });
      break;
    }
    
    case "combobox": {
      el.classList.add("ov-combobox-ctl");
      el.style.fontSize = c.fontSize + "px";
      const select = document.createElement("select");
      select.style.width = "100%";
      select.style.height = "100%";
      select.style.fontSize = c.fontSize + "px";
      select.style.border = "1px solid #000080";
      select.style.borderRadius = "2px";
      select.readOnly = state.mode === "design";
      (c.items || "").split(",").forEach((t, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = t.trim();
        if (i === (c.selIndex ?? 0)) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", () => {
        c.selIndex = parseInt(select.value);
        fireEvent(c, "OnChange");
      });
      select.addEventListener("pointerdown", e => { if (state.mode === "design") e.preventDefault(); e.stopPropagation(); });
      el.appendChild(select);
      break;
    }
    
    case "spinner": {
      el.classList.add("ov-spinner-ctl");
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.gap = "4px";
      el.style.padding = "2px";
      const input = document.createElement("input");
      input.type = "number";
      input.value = c.value;
      input.min = c.minValue;
      input.max = c.maxValue;
      input.style.flex = "1";
      input.style.border = "1px solid #000080";
      input.readOnly = state.mode === "design";
      input.addEventListener("change", () => {
        c.value = parseInt(input.value) || 0;
        fireEvent(c, "OnChange");
      });
      input.addEventListener("pointerdown", e => { if (state.mode === "design") e.preventDefault(); e.stopPropagation(); });
      const btnUp = document.createElement("button");
      btnUp.textContent = "▲";
      btnUp.style.width = "20px";
      btnUp.style.height = "12px";
      btnUp.style.padding = "0";
      btnUp.style.fontSize = "8px";
      if (state.mode === "run") {
        btnUp.addEventListener("click", e => {
          e.stopPropagation();
          c.value = Math.min(c.maxValue, c.value + c.step);
          input.value = c.value;
          fireEvent(c, "OnChange");
        });
      }
      const btnDn = document.createElement("button");
      btnDn.textContent = "▼";
      btnDn.style.width = "20px";
      btnDn.style.height = "12px";
      btnDn.style.padding = "0";
      btnDn.style.fontSize = "8px";
      if (state.mode === "run") {
        btnDn.addEventListener("click", e => {
          e.stopPropagation();
          c.value = Math.max(c.minValue, c.value - c.step);
          input.value = c.value;
          fireEvent(c, "OnChange");
        });
      }
      el.appendChild(input);
      const btns = document.createElement("div");
      btns.style.display = "flex";
      btns.style.flexDirection = "column";
      btns.style.gap = "0px";
      btns.appendChild(btnUp);
      btns.appendChild(btnDn);
      el.appendChild(btns);
      break;
    }
    
    case "datepicker": {
      el.classList.add("ov-datepicker-ctl");
      const input = document.createElement("input");
      input.type = "date";
      input.value = c.value;
      input.style.width = "100%";
      input.style.height = "100%";
      input.style.border = "1px solid #000080";
      input.readOnly = state.mode === "design";
      input.addEventListener("change", () => {
        c.value = input.value;
        fireEvent(c, "OnChange");
      });
      input.addEventListener("pointerdown", e => { if (state.mode === "design") e.preventDefault(); e.stopPropagation(); });
      el.appendChild(input);
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

/* ==================== INTERACCIÓN ==================== */
const CTL_RESIZE_DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
const CTL_MIN_W = 16;
const CTL_MIN_H = 12;

function snap4(v) { return Math.round(v / 4) * 4; }

function attachControlEvents(el, c) {
  el.addEventListener("pointerdown", e => {
    if (state.mode !== "design") return;
    e.stopPropagation();
    if (e.button !== 0) return;

    const handle = e.target.closest(".ctl-resize-handle");
    selectControl(c.id);
    if (handle) {
      startControlResize(e, c, handle.dataset.dir || "se");
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
  e.preventDefault();
  const sx = e.clientX, sy = e.clientY;
  const ox = c.left, oy = c.top;
  try { el.setPointerCapture(e.pointerId); } catch (_) {}
  const move = ev => {
    c.left = Math.max(0, snap4(ox + ev.clientX - sx));
    c.top  = Math.max(0, snap4(oy + ev.clientY - sy));
    el.style.left = c.left + "px";
    el.style.top = c.top + "px";
    updatePosStatus(c);
    refreshInspectorNumbers(c);
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    pushHistory();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function startControlResize(e, c, dir) {
  e.preventDefault();
  e.stopPropagation();
  const sx = e.clientX, sy = e.clientY;
  const start = { left: c.left, top: c.top, width: c.width, height: c.height };
  const el = document.getElementById(c.id);
  if (!el) return;
  try { el.setPointerCapture(e.pointerId); } catch (_) {}

  const move = ev => {
    const dx = ev.clientX - sx;
    const dy = ev.clientY - sy;
    let left = start.left, top = start.top, width = start.width, height = start.height;

    if (dir.includes("e")) width = start.width + dx;
    if (dir.includes("s")) height = start.height + dy;
    if (dir.includes("w")) {
      width = start.width - dx;
      left = start.left + dx;
    }
    if (dir.includes("n")) {
      height = start.height - dy;
      top = start.top + dy;
    }

    // Mínimos (corrigiendo left/top si se arrastra desde n/w)
    if (width < CTL_MIN_W) {
      if (dir.includes("w")) left = start.left + start.width - CTL_MIN_W;
      width = CTL_MIN_W;
    }
    if (height < CTL_MIN_H) {
      if (dir.includes("n")) top = start.top + start.height - CTL_MIN_H;
      height = CTL_MIN_H;
    }

    // No salir por la izquierda/arriba del lienzo
    if (left < 0) {
      if (dir.includes("w")) width += left;
      left = 0;
    }
    if (top < 0) {
      if (dir.includes("n")) height += top;
      top = 0;
    }

    c.left = snap4(left);
    c.top = snap4(top);
    c.width = Math.max(CTL_MIN_W, snap4(width));
    c.height = Math.max(CTL_MIN_H, snap4(height));

    el.style.left = c.left + "px";
    el.style.top = c.top + "px";
    el.style.width = c.width + "px";
    el.style.height = c.height + "px";
    updatePosStatus(c);
    refreshInspectorNumbers(c);
  };

  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    pushHistory();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function markSelected(el) {
  el.classList.add("selected");
  // Quitar asas previas por si se re-renderiza
  el.querySelectorAll(".ctl-resize-handle").forEach(h => h.remove());
  CTL_RESIZE_DIRS.forEach(dir => {
    const h = document.createElement("div");
    h.className = "ctl-resize-handle " + dir;
    h.dataset.dir = dir;
    h.title = "Redimensionar";
    el.appendChild(h);
  });
}

/* ==================== SELECCIÓN ==================== */
function selectControl(id) {
  state.selectedId = id;
  document.querySelectorAll(".ov-control.selected").forEach(e => {
    e.classList.remove("selected");
    e.querySelectorAll(".ctl-resize-handle, .resize-handle").forEach(h => h.remove());
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

/* ==================== INSPECTOR AVANZADO ==================== */
const PROP_DEFS = {
  label:      ["name", "caption", "left", "top", "width", "height", "color", "fontSize", "visible", "enabled"],
  button:     ["name", "caption", "left", "top", "width", "height", "color", "fontSize", "visible", "enabled"],
  edit:       ["name", "text", "placeholder", "left", "top", "width", "height", "color", "bgColor", "fontSize", "visible", "enabled"],
  textarea:   ["name", "text", "left", "top", "width", "height", "color", "bgColor", "fontSize", "rows", "cols", "visible", "enabled"],
  checkbox:   ["name", "caption", "checked", "left", "top", "width", "height", "color", "fontSize", "visible", "enabled"],
  radio:      ["name", "caption", "checked", "group", "left", "top", "width", "height", "color", "fontSize", "visible", "enabled"],
  listbox:    ["name", "items", "left", "top", "width", "height", "color", "fontSize", "visible", "enabled"],
  combobox:   ["name", "items", "left", "top", "width", "height", "color", "fontSize", "editable", "visible", "enabled"],
  spinner:    ["name", "value", "minValue", "maxValue", "step", "left", "top", "width", "height", "visible", "enabled"],
  datepicker: ["name", "value", "format", "left", "top", "width", "height", "visible", "enabled"],
  groupbox:   ["name", "caption", "left", "top", "width", "height", "color", "fontSize", "visible", "enabled"],
  panel:      ["name", "left", "top", "width", "height", "bgColor", "borderStyle", "visible", "enabled"],
};

const PROP_LABELS = {
  name: "Nombre", caption: "Título", text: "Texto", placeholder: "Placeholder",
  left: "Izquierda", top: "Superior", width: "Ancho", height: "Alto",
  color: "Color", bgColor: "Color Fondo", fontSize: "Tamaño letra",
  checked: "Marcado", items: "Elementos", group: "Grupo",
  value: "Valor", minValue: "Mínimo", maxValue: "Máximo", step: "Paso",
  format: "Formato", rows: "Filas", cols: "Columnas", editable: "Editable",
  borderStyle: "Estilo borde", visible: "Visible", enabled: "Habilitado",
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

  PROP_DEFS[c.type]?.forEach(key => {
    const row = document.createElement("div");
    row.className = "prop-row";
    const val = c[key];
    let input;
    
    if (key === "checked") {
      input = document.createElement("select");
      input.innerHTML = `<option value="true"${val ? " selected" : ""}>Verdadero</option><option value="false"${!val ? " selected" : ""}>Falso</option>`;
      input.addEventListener("change", () => { c.checked = input.value === "true"; rerender(c); });
    } else if (key === "visible" || key === "enabled" || key === "editable") {
      input = document.createElement("select");
      input.innerHTML = `<option value="true"${val ? " selected" : ""}>Sí</option><option value="false"${!val ? " selected" : ""}>No</option>`;
      input.addEventListener("change", () => { c[key] = input.value === "true"; rerender(c); });
    } else if (key === "color" || key === "bgColor") {
      input = document.createElement("input");
      input.type = "color";
      input.value = val;
      input.addEventListener("input", () => { c[key] = input.value; rerender(c); });
    } else if (["left", "top", "width", "height", "fontSize", "value", "minValue", "maxValue", "step", "rows", "cols"].includes(key)) {
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
  Object.entries(c.events || {}).forEach(([evName, ev]) => {
    const row = document.createElement("div");
    row.className = "ev-row";
    row.innerHTML = `<span class="ev-name"><span class="bolt">⚡</span> ${evName}</span>`;
    const wrap = document.createElement("span");
    wrap.className = "prop-val";
    const sel = document.createElement("select");
    sel.innerHTML = `
      <option value="none"${ev.action === "none" ? " selected" : ""}>(ninguna)</option>
      <option value="message"${ev.action === "message" ? " selected" : ""}>Mostrar mensaje</option>
      <option value="alert"${ev.action === "alert" ? " selected" : ""}>Alerta</option>
      <option value="disable"${ev.action === "disable" ? " selected" : ""}>Desactivar control</option>`;
    sel.addEventListener("change", () => {
      ev.action = sel.value;
      if (ev.action === "message" || ev.action === "alert") {
        const t = prompt("Texto para " + evName + ":", ev.message || "");
        ev.message = t ?? ev.message;
      }
      buildInspector();
    });
    wrap.appendChild(sel);
    row.appendChild(wrap);
    inspEvents.appendChild(row);
    
    if ((ev.action === "message" || ev.action === "alert") && ev.message) {
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

/* ==================== MODO EJECUCIÓN ==================== */
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

function fireEvent(c, evName) {
  const ev = c.events[evName];
  if (!ev || ev.action === "none") return;
  
  if (ev.action === "message") {
    showRetroMessage(ev.message || "(mensaje vacío)", c.name);
  } else if (ev.action === "alert") {
    alert(ev.message || "Evento: " + evName);
  } else if (ev.action === "disable") {
    c.enabled = !c.enabled;
    renderControl(c);
  }
}

/* ==================== CUADRO DE MENSAJE RETRO ==================== */
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

/* ==================== MENÚS MEJORADOS ==================== */
const MENUS = {
  file: [
    { label: "Nuevo", shortcut: "Ctrl+N", action: clearForm },
    { label: "Abrir…", shortcut: "Ctrl+O", action: importJSON },
    { label: "Guardar", shortcut: "Ctrl+S", action: exportJSON },
    "sep",
    { label: "Salir", action: () => msg("¡Gracias por usar ObjectVision! (cierre la pestaña para salir)") },
  ],
  edit: [
    { label: "Deshacer", shortcut: "Ctrl+Z", action: undo },
    { label: "Rehacer", shortcut: "Ctrl+Y", action: redo },
    "sep",
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

/* ==================== ACCIONES ==================== */
function deleteSelected() {
  if (!state.selectedId) return msg("No hay ningún objeto seleccionado.");
  const c = getControl(state.selectedId);
  state.controls = state.controls.filter(x => x.id !== state.selectedId);
  document.getElementById(state.selectedId)?.remove();
  msg(`${c.name} eliminado.`);
  selectControl(null);
  pushHistory();
}

function clearForm() {
  state.controls = [];
  state.selectedId = null;
  state.counter = {};
  state.history = [];
  state.historyIndex = -1;
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
  pushHistory();
}

function resetValues() {
  state.controls.forEach(c => {
    if (c.type === "edit" || c.type === "textarea") c.text = "";
    if (c.type === "checkbox" || c.type === "radio") c.checked = false;
    if (c.type === "listbox" || c.type === "combobox") c.selIndex = 0;
    if (c.type === "spinner") c.value = c.minValue || 0;
  });
  renderAll();
  msg("Valores reiniciados.");
}

/* ==================== GUARDAR / ABRIR ==================== */
function exportJSON() {
  const data = { app: "ObjectVision Web", version: "2.1", form: "Form1", controls: state.controls };
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
        state.history = [];
        state.historyIndex = -1;
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

/* ==================== BARRA DE HERRAMIENTAS ==================== */
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

/* ==================== PESTAÑAS DEL INSPECTOR ==================== */
document.querySelectorAll(".inspector-tabs .tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".inspector-tabs .tab").forEach(x => x.classList.toggle("active", x === t));
    inspProps.classList.toggle("hidden", t.dataset.tab !== "props");
    inspEvents.classList.toggle("hidden", t.dataset.tab !== "events");
  });
});

/* ==================== VENTANA PRINCIPAL (arrastrable) ==================== */
(function enableMainWindowDrag() {
  const win = document.getElementById("mainWindow");
  if (!win) return;
  const bar = win.querySelector(":scope > .title-bar");
  if (!bar) return;

  function centerMainWindow() {
    const w = win.offsetWidth || 1024;
    const h = win.offsetHeight || 680;
    win.style.left = Math.max(0, Math.round((window.innerWidth - w) / 2)) + "px";
    win.style.top = Math.max(0, Math.round((window.innerHeight - h) / 2)) + "px";
  }
  centerMainWindow();
  window.addEventListener("resize", () => {
    // Mantener la ventana visible si se redimensiona el navegador
    const r = win.getBoundingClientRect();
    const maxL = Math.max(0, window.innerWidth - 80);
    const maxT = Math.max(0, window.innerHeight - 40);
    if (r.left > maxL) win.style.left = maxL + "px";
    if (r.top > maxT) win.style.top = maxT + "px";
    if (r.left < 0) win.style.left = "0px";
    if (r.top < 0) win.style.top = "0px";
  });

  bar.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    // No arrastrar al pulsar los botones de la barra
    if (e.target.closest(".title-buttons, .tb-btn")) return;
    e.preventDefault();
    const r = win.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    try { bar.setPointerCapture(e.pointerId); } catch (_) {}

    const move = ev => {
      const left = Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - 80);
      const top = Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - 40);
      win.style.left = left + "px";
      win.style.top = top + "px";
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
})();

/* ==================== VENTANAS FLOTANTES ==================== */
const FLOATING_WINDOWS = [
  { id: "formWindow",      minW: 240, minH: 160, def: { left: 16, top: 16, width: 650, height: 520, right: null } },
  { id: "paletteWindow",   minW: 110, minH: 140, def: { left: null, top: 16, width: 140, height: 280, right: 16 } },
  { id: "inspectorWindow", minW: 200, minH: 160, def: { left: null, top: 310, width: 320, height: 290, right: 16 } },
];

const RESIZE_HANDLES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

function pinWindowToLeft(win, area) {
  const wr = win.getBoundingClientRect();
  win.style.left = (wr.left - area.left) + "px";
  win.style.top = (wr.top - area.top) + "px";
  win.style.right = "auto";
  win.style.width = wr.width + "px";
  win.style.height = wr.height + "px";
  return { left: wr.left - area.left, top: wr.top - area.top, width: wr.width, height: wr.height };
}

function startWindowResize(e, win, dir, minW, minH) {
  e.preventDefault();
  e.stopPropagation();
  const areaEl = document.getElementById("mdiArea");
  const area = areaEl.getBoundingClientRect();
  const start = pinWindowToLeft(win, area);
  const sx = e.clientX, sy = e.clientY;
  win.style.zIndex = ++state.zTop + 20;

  const move = ev => {
    const dx = ev.clientX - sx;
    const dy = ev.clientY - sy;
    let { left, top, width, height } = start;

    if (dir.includes("e")) width = start.width + dx;
    if (dir.includes("s")) height = start.height + dy;
    if (dir.includes("w")) {
      width = start.width - dx;
      left = start.left + dx;
    }
    if (dir.includes("n")) {
      height = start.height - dy;
      top = start.top + dy;
    }

    // Mínimos (ajustando left/top si se redimensiona desde n/w)
    if (width < minW) {
      if (dir.includes("w")) left = start.left + start.width - minW;
      width = minW;
    }
    if (height < minH) {
      if (dir.includes("n")) top = start.top + start.height - minH;
      height = minH;
    }

    // Mantener dentro del área MDI
    if (left < 0) {
      if (dir.includes("w")) width += left;
      left = 0;
    }
    if (top < 0) {
      if (dir.includes("n")) height += top;
      top = 0;
    }
    if (left + width > area.width) width = Math.max(minW, area.width - left);
    if (top + height > area.height) height = Math.max(minH, area.height - top);

    win.style.left = left + "px";
    win.style.top = top + "px";
    win.style.width = width + "px";
    win.style.height = height + "px";
  };

  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

FLOATING_WINDOWS.forEach(({ id, minW, minH }) => {
  const win = document.getElementById(id);
  if (!win) return;

  // Arrastre por la barra de título
  const bar = win.querySelector(".title-bar");
  bar.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    const area = document.getElementById("mdiArea").getBoundingClientRect();
    const wr = win.getBoundingClientRect();
    const dx = e.clientX - wr.left, dy = e.clientY - wr.top;
    pinWindowToLeft(win, area);
    win.style.zIndex = ++state.zTop + 20;
    const move = ev => {
      win.style.left = Math.min(Math.max(0, ev.clientX - area.left - dx), area.width - 60) + "px";
      win.style.top  = Math.min(Math.max(0, ev.clientY - area.top - dy), area.height - 30) + "px";
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });

  // Asas de redimensionado
  RESIZE_HANDLES.forEach(dir => {
    const h = document.createElement("div");
    h.className = "win-resize-handle " + dir;
    h.title = "Redimensionar";
    h.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      startWindowResize(e, win, dir, minW, minH);
    });
    win.appendChild(h);
  });
});

function resetWindows() {
  FLOATING_WINDOWS.forEach(({ id, def }) => {
    const w = document.getElementById(id);
    if (!w) return;
    w.style.width = def.width + "px";
    w.style.height = def.height + "px";
    w.style.top = def.top + "px";
    if (def.left != null) {
      w.style.left = def.left + "px";
      w.style.right = "auto";
    } else {
      w.style.left = "auto";
      w.style.right = def.right + "px";
    }
  });
  msg("Ventanas reordenadas.");
}

/* ==================== TECLADO ==================== */
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
  if (e.key === "Delete") deleteSelected();
  if (e.key === "F9") setMode(state.mode === "design" ? "run" : "design");
  if (e.key === "Escape") { closeMenu(); toggleModal(false); }
  if (e.ctrlKey && e.key.toLowerCase() === "s") { e.preventDefault(); exportJSON(); }
  if (e.ctrlKey && e.key.toLowerCase() === "o") { e.preventDefault(); importJSON(); }
  if (e.ctrlKey && e.key.toLowerCase() === "n") { e.preventDefault(); clearForm(); }
  if (e.ctrlKey && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
  if (e.ctrlKey && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
  
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

/* ==================== POSICIÓN DEL RATÓN ==================== */
canvas.addEventListener("pointermove", e => {
  if (state.mode !== "design") return;
  const r = canvas.getBoundingClientRect();
  if (!state.selectedId) stPos.textContent = `X:${Math.round(e.clientX - r.left)} Y:${Math.round(e.clientY - r.top)}`;
});

/* ==================== EJEMPLO INICIAL MEJORADO ==================== */
(function seed() {
  const g = addControl("groupbox", 24, 20); 
  g.caption = "Registro de Cliente"; 
  g.width = 320; 
  g.height = 200;
  
  const l1 = addControl("label", 44, 56);  
  l1.caption = "Nombre:";
  const e1 = addControl("edit", 140, 52);  
  e1.width = 160;
  e1.placeholder = "Juan Pérez";
  
  const l2 = addControl("label", 44, 92);  
  l2.caption = "Email:";
  const e2 = addControl("edit", 140, 88);  
  e2.width = 160;
  e2.placeholder = "juan@example.com";
  
  const l3 = addControl("label", 44, 128);
  l3.caption = "Tipo:";
  const cb = addControl("combobox", 140, 124); 
  cb.items = "Cliente Normal,Cliente Preferente,Distribuidor";
  cb.width = 160;
  
  const lb = addControl("listbox", 360, 20); 
  lb.caption = "Últimos pedidos"; 
  lb.items = "Pedido #1001,Pedido #1002,Pedido #1003,Pedido #1004";
  lb.width = 200;
  
  const b1 = addControl("button", 140, 160); 
  b1.caption = "Guardar";
  b1.width = 70;
  b1.events.OnClick = { action: "message", message: "¡Cliente registrado correctamente!" };
  
  const b2 = addControl("button", 230, 160); 
  b2.caption = "Limpiar";
  b2.width = 70;
  b2.events.OnClick = { action: "message", message: "Formulario limpiado." };
  
  selectControl(null);
  msg("ObjectVision 2.1 — Formulario mejorado cargado. ¡Comience a diseñar!");
})();
