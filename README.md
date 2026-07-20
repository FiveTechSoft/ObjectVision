# 🎨 ObjectVision – Diseñador Visual de Formularios

**ObjectVision** es una recreación web del legendario **Borland ObjectVision** (1992), un entorno visual para diseñar formularios e interfaces de usuario sin necesidad de programación. Esta versión moderna en HTML5, CSS3 y JavaScript vanilla mantiene el espíritu retro del original mientras proporciona una experiencia completa de diseño visual.

## ✨ Características Principales

### 🎯 Modo Diseño
- **Paleta de controles** intuitiva con 8+ tipos de objetos
- **Arrastrar y soltar** controles en el lienzo
- **Redimensionamiento** con manejadores visuales
- **Cuadrícula de alineación** para posicionamiento preciso
- **Selector visual** con propiedades en tiempo real
- **Inspector de propiedades** completo (posición, tamaño, colores, texto)
- **Gestor de eventos** con acciones predefinidas
- **Ventanas flotantes y redimensionables** (MDI style)

### 🚀 Modo Ejecución
- **Previsualización en vivo** de formularios
- **Interactividad completa** de controles
- **Validación de eventos** (OnClick, OnChange)
- **Mensajes emergentes** retroactivos

### 💾 Persistencia
- **Guardar/Cargar en JSON** para reutilizar diseños
- **Exportación de formularios** listos para integración
- **Importación de proyectos** anteriores

### 🎮 Atajos de Teclado
- `F9` – Cambiar entre diseño y ejecución
- `Ctrl+N` – Nuevo formulario
- `Ctrl+S` – Guardar como JSON
- `Ctrl+O` – Abrir JSON
- `Supr` – Eliminar objeto seleccionado
- `Flechas` – Mover objeto (pixel a pixel o 8px con Shift)
- `Esc` – Cerrar menús/diálogos

## 🧩 Controles Disponibles

| Control | Ícono | Propiedades Clave |
|---------|-------|-------------------|
| **Etiqueta** | Aᴀ | Texto, Color, Tamaño de letra |
| **Campo de texto** | ✎ | Texto inicial, Color fondo |
| **Botón** | ▭ | Título, Eventos OnClick |
| **Casilla de verificación** | ☑ | Estado (marcado/desmarcado) |
| **Radio button** | ◉ | Grupo, Estado |
| **Lista desplegable** | ☰ | Elementos, Selección |
| **Grupo** | ⬚ | Contenedor visual |
| **Panel** | ▦ | Contenedor con fondo personalizable |

## 🎨 Sistema de Propiedades

Cada control es completamente personalizable:

```javascript
{
  id: "ctl1234567890",
  type: "button",
  name: "Botón1",
  left: 120,           // posición X
  top: 200,            // posición Y
  width: 80,           // ancho en píxeles
  height: 26,          // altura en píxeles
  caption: "Aceptar",  // texto visible
  color: "#000000",    // color de texto
  fontSize: 11,        // tamaño de fuente
  events: {
    OnClick: { action: "message", message: "¡Guardado!" },
    OnChange: { action: "none", message: "" }
  }
}
```

## 🖥️ Interfaz de Usuario

### Barra de menús
- **Archivo** – Nuevo, Abrir, Guardar, Salir
- **Editar** – Eliminar, Limpiar, Orden Z (frente/fondo)
- **Ver** – Cambiar modo, Centrar ventanas
- **Objeto** – Insertar cualquier control
- **Ejecutar** – Modo ejecución, Reiniciar valores
- **Ayuda** – Información del programa

### Barra de herramientas (SpeedBar)
```
📄 Nuevo | 💾 Guardar | 📂 Abrir | ✂ Eliminar | 🗑 Limpiar | ▶ Ejecutar | ❓ Ayuda
```

### Ventanas flotantes (MDI)
1. **Diseñador de formulario** – Canvas principal
2. **Paleta de objetos** – Selección de controles
3. **Inspector de propiedades** – Edición de atributos y eventos

## 🚀 Cómo Empezar

### Acceso rápido
Abre el archivo `index.html` en tu navegador (Chrome, Firefox, Edge, Safari).

```bash
# Si tienes un servidor local (Python)
python -m http.server 8000
# Luego abre: http://localhost:8000
```

### Workflow básico

1. **Diseña tu formulario**
   - Selecciona controles de la **Paleta**
   - Haz clic en el lienzo para colocarlos
   - Arrastra para mover, redimensiona con la esquina

2. **Personaliza propiedades**
   - Selecciona un control
   - Modifica en el **Inspector**: posición, tamaño, colores, texto
   - Configura eventos (OnClick, OnChange)

3. **Prueba en vivo**
   - Presiona `F9` o usa el botón ▶
   - Interactúa con los controles
   - Los eventos se disparan automáticamente

4. **Guarda tu trabajo**
   - Presiona `Ctrl+S` o usa 💾
   - Se descarga un archivo `form1.ov.json`
   - Recarga con `Ctrl+O` o 📂

## 📋 Ejemplos Prácticos

### Formulario de contacto
```
1. Agregar etiqueta "Nombre:"
2. Agregar campo de texto para nombre
3. Agregar etiqueta "Email:"
4. Agregar campo de texto para email
5. Agregar botón "Enviar"
6. Configurar OnClick del botón → mensaje "¡Gracias!"
7. Presionar F9 para previsualizar
```

### Encuesta simple
```
1. Agregar grupo "¿Te gustó?"
2. Agregar dos radio buttons: "Sí" y "No"
3. Agregar lista con opciones: "Muy bien", "Bien", "Regular", "Mal"
4. Agregar botón "Finalizar"
```

## 🎯 Características Avanzadas

### Orden Z (profundidad)
- Menú **Editar** → "Traer al frente" / "Enviar al fondo"
- Útil cuando superpones controles

### Cuadrícula inteligente
- Alineación automática cada 8 píxeles en diseño
- Movimiento fino con flechas (1px) o jumps (8px con Shift)

### Inspector multi-tab
- **Pestaña Propiedades** – Todos los atributos
- **Pestaña Eventos** – Configuración de handlers

### Validación visual
- Controles seleccionados muestran borde punteado
- Manejador de esquina para redimensionar

## 🔧 Stack Técnico

| Aspecto | Tecnología |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Arquitectura | MVC sin frameworks |
| Persistencia | JSON (localStorage compatible) |
| Estilo | Retro Windows 3.x (CSS puro) |
| Navegadores | Chrome, Firefox, Edge, Safari (moderno) |
| Tamaño | ~15KB HTML/CSS/JS combinado |

## 📁 Estructura del Proyecto

```
ObjectVision/
├── index.html           # Interfaz principal
├── app.js               # Lógica completa (diseño, ejecución, eventos)
├── styles.css           # Estilo retro Windows 3.x
└── README.md            # Este archivo
```

## 🎓 Casos de Uso

- **Educación** – Enseñanza de interfaces visuales sin programación
- **Prototipado** – Diseño rápido de mockups de formularios
- **Nostalgia** – Experiencia retro del diseño visual clásico
- **Portfolio** – Demostración de habilidades front-end
- **Herramienta pedagógica** – Aprender sobre DOM, eventos y UI

## 🌐 Compatibilidad

| Navegador | Soporte |
|-----------|---------|
| Chrome | ✅ Completo |
| Firefox | ✅ Completo |
| Edge | ✅ Completo |
| Safari | ✅ Completo |
| IE 11 | ❌ No soportado |

## 📝 Notas Técnicas

- **Sin dependencias externas** – JavaScript vanilla puro
- **Responsive-friendly** – Funciona en pantallas grandes (optimizado para 1024x768+)
- **Accesibilidad** – Soporte básico de teclado
- **Persistencia local** – JSON para guardar/cargar diseños

## 🎨 Estilo Visual

ObjectVision recreaba fielmente la interfaz de **Windows 3.x / Borland 1992**:
- Paleta de colores gris corporativa
- Bordes biselados 3D
- Fuente MS Sans Serif / Tahoma
- Título de ventana azul marino degradado
- Efectos de sombra inset para profundidad

## 📚 Recursos Originales

- **Borland ObjectVision 2.0** (1992) – Software original
- Documentación histórica y referencias de UI/UX clásica
- Comunidad retro computing

## 📄 Licencia

Recreación con fines educativos. Homenaje a Borland International, Inc.

---

**¿Listo para diseñar?** 🚀  
Abre `index.html` y comienza a crear formularios visuales sin código.

**Atajos rápidos:**
- `F9` = Diseño ↔ Ejecución
- `Ctrl+S` = Guardar
- `Ctrl+O` = Abrir
- `Supr` = Eliminar
