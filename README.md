# 🦂 PROYECTO SCORPION TAIL — README TÉCNICO COMPLETO
**Academia de Guerra Aérea · Fuerza Aérea de Chile**
`v2.0` · Desarrollado por Toti's® (Víctor Manuel Garcés Borje) · Systems Technician AGA

---

## 📋 ÍNDICE
1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Flujo de Desarrollo Obligatorio](#flujo-de-desarrollo-obligatorio)
5. [Módulos Activos](#módulos-activos)
6. [Sistema de Login (SHA-256)](#sistema-de-login-sha-256)
7. [10 FIXES Obligatorios](#10-fixes-obligatorios)
8. [Convenciones de Código](#convenciones-de-código)
9. [TODO / Roadmap](#todo--roadmap)
10. [Historial de Versiones](#historial-de-versiones)

---

## Descripción General

**Scorpion Tail** es el sistema de gestión institucional de la Academia de Guerra Aérea (AGA), FACH. Es una PWA (Progressive Web App) de arquitectura **single-file** que centraliza módulos operativos del área de Sistemas: adquisiciones, vales de entrega, mantención, bitácora, inventario, presupuesto, control de personal, informes y más.

El sistema está protegido por **dos capas de seguridad**:
- **Capa 1 (Cloudflare Zero Trust Access)**: control perimetral vía email PIN en `totis.cl`
- **Capa 2 (SHA-256 Login)**: autenticación interna en `index.html` con hash de contraseña via `crypto.subtle`

Acceso público (autenticado): `https://totis.cl` → redirige a `https://vgarcesb-cpu.github.io/scorpion-tail/`

---

## Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                  USUARIO FINAL                        │
│        (Chrome / Safari / Samsung S25)                │
└───────────────────┬──────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼──────────────────────────────────┐
│           CLOUDFLARE (DNS + Zero Trust)               │
│   totis.cl → proxied A records → GitHub Pages         │
└───────────────────┬──────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────┐
│              GITHUB PAGES                             │
│   vgarcesb-cpu.github.io/scorpion-tail/               │
│   ┌─────────────────────────────────────────────┐    │
│   │  index.html  (Login + App Shell + Router)    │    │
│   │  manifest.json  sw.js  icon-192.png          │    │
│   │  mantencion.html  bitacora.html              │    │
│   │  inventario.html  presupuesto.html           │    │
│   │  personal.html    informes.html              │    │
│   │  informe.html                                │    │
│   └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘

MÓDULOS EXTERNOS (repos independientes):
  vgarcesb-cpu.github.io/solicitud-fach/    ← Solicitud Adquisición
  vgarcesb-cpu.github.io/vale-de-entrega/   ← Vale de Entrega
  vgarcesb-cpu.github.io/Poseidon-s-Seal/   ← Sello Poseidón (custodias)
```

**Stack tecnológico:**
- HTML5 + CSS3 + Vanilla JS (sin frameworks)
- IndexedDB para persistencia local
- Service Worker para offline (cache-first)
- Web Crypto API (`crypto.subtle`) para hashing SHA-256
- `sessionStorage` para control de sesión en `index.html`
- `localStorage` para estadísticas de módulos externos
- CDN: QRCode.js (cdnjs), Html5-QRCode (unpkg)

---

## Estructura de Archivos

```
scorpion-tail/
├── index.html          ← HUB principal: login + dashboard + router de módulos
├── manifest.json       ← PWA manifest (nombre, iconos, colores, display)
├── sw.js               ← Service Worker (cache-first, offline support)
├── icon-192.png        ← Ícono PWA 192x192
├── icon-512.png        ← Ícono PWA 512x512 (requerido para instalación)
├── mantencion.html     ← Módulo Check List Mantención
├── bitacora.html       ← Módulo Bitácora de Novedades
├── inventario.html     ← Módulo Inventario Repuestos
├── presupuesto.html    ← Módulo Saldo Presupuesto (estilo DIPRES)
├── personal.html       ← Módulo Control Personal (salida/entrada)
├── informes.html       ← Módulo Informes y Reportes (resumen ejecutivo)
├── informe.html        ← Módulo Informe Técnico (fallas y accidentes)
└── README.md           ← Este archivo
```

---

## Flujo de Desarrollo Obligatorio

> ⚠️ **REGLA DE ORO**: Nunca asumir que algo funciona sin pasar las 3 etapas.

```
ETAPA 1 — DESARROLLO (Mac)
  ├─ Editor: VS Code / cualquier editor
  ├─ Prueba: Chrome DevTools + Safari
  ├─ Git: commit + push a main
  └─ Comando: git add . && git commit -m "feat: ..." && git push

         ↓ GitHub Actions auto-deploy (~30s)

ETAPA 2 — VALIDACIÓN PÚBLICA (GitHub Pages)
  ├─ URL: https://vgarcesb-cpu.github.io/scorpion-tail/
  ├─ Verificar: consola sin errores, flujos completos
  ├─ Verificar: PDF, firmas canvas, IndexedDB
  └─ Verificar: PWA instalable (manifest + SW activo)

         ↓ Si ETAPA 2 OK

ETAPA 3 — PRUEBA FINAL EN TERRENO (Samsung S25)
  ├─ Navegador: Chrome Android (juez definitivo)
  ├─ Verificar: touch events, canvas firma táctil
  ├─ Verificar: rotación pantalla (landscape/portrait)
  ├─ Verificar: impresión PDF (modal post-guardado)
  └─ Verificar: escáner QR cámara trasera

  ✅ APROBADO → versión lista para uso operativo
  ❌ FALLA → volver a ETAPA 1 con fix documentado
```

**Entornos involucrados:**

| Dispositivo | Rol | URL de prueba |
|---|---|---|
| Mac (Chrome/Safari) | Desarrollo | localhost / GitHub Pages |
| GitHub Pages | Validación pública | vgarcesb-cpu.github.io/scorpion-tail/ |
| Samsung S25 | Juez definitivo en terreno | totis.cl |
| Windows PC | Consulta / impresión | totis.cl |
| WD MyCloud | Sync automático red local | API REST WiFi local |

---

## Módulos Activos

### ✅ Módulos en producción (externos)

| Módulo | Repo | URL | Estado |
|---|---|---|---|
| Solicitud de Adquisición | `vgarcesb-cpu/solicitud-fach` | /solicitud-fach/ | ✅ Activo |
| Vale de Entrega | `vgarcesb-cpu/vale-de-entrega` | /vale-de-entrega/ | ✅ Activo |
| Sello Poseidón | `vgarcesb-cpu/Poseidon-s-Seal` | /Poseidon-s-Seal/ | ✅ Activo v2.0.0 |

### ✅ Módulos en repo Scorpion Tail

| Módulo | Archivo | Color | Función |
|---|---|---|---|
| Check List Mantención | `mantencion.html` | `#2ecc71` Verde | Preventivo y correctivo |
| Bitácora | `bitacora.html` | `#e67e22` Naranja | Registro de novedades |
| Inventario Repuestos | `inventario.html` | `#9b59b6` Púrpura | Control de stock |
| Saldo Presupuesto | `presupuesto.html` | `#1abc9c` Turquesa | Control tipo DIPRES |
| Control Personal | `personal.html` | `#e74c3c` Rojo | Salida/entrada unidad |
| Informes y Reportes | `informes.html` | `#f39c12` Amarillo | Resumen ejecutivo |
| Informe Técnico | `informe.html` | `#c0392b` Rojo oscuro | Fallas y accidentes |

### 📊 Dashboard (index.html)

El `index.html` muestra estadísticas en tiempo real:
- **Adquisiciones**: cuenta de `localStorage["adquisicion_historial"]`
- **Vales**: cuenta de `localStorage["vale_historial"]`
- **Módulos**: contador estático (9 módulos totales declarados)

---

## Sistema de Login (SHA-256)

```javascript
// CREDENCIALES EN PRODUCCIÓN
var U = "victor";                      // Usuario en texto plano
var H = "5c10b00d...";                 // Hash SHA-256 de la contraseña

// FLUJO DE VERIFICACIÓN
async function verificarLogin() {
  // 1. Hashear la contraseña ingresada con crypto.subtle
  var buf = await crypto.subtle.digest("SHA-256",
              new TextEncoder().encode(passwordIngresada));
  var hex = Array.from(new Uint8Array(buf))
              .map(b => b.toString(16).padStart(2,"0")).join("");

  // 2. Comparar: usuario === U && hash === H
  if (u === U && hex === H) {
    sessionStorage.setItem("st_auth", "ok");   // Sesión activa
    mostrarApp();
  } else {
    mostrarError();
  }
}

// PERSISTENCIA DE SESIÓN (recarga de página)
if (sessionStorage.getItem("st_auth") === "ok") mostrarApp();
```

**Notas de seguridad:**
- La contraseña NUNCA viaja ni se almacena en texto plano
- `sessionStorage` se borra al cerrar el navegador/pestaña
- La Capa 1 (Cloudflare Zero Trust) agrega autenticación perimetral adicional
- Para cambiar contraseña: generar nuevo SHA-256 y actualizar `var H`

**Generar nuevo hash SHA-256 (consola Chrome):**
```javascript
crypto.subtle.digest("SHA-256", new TextEncoder().encode("nueva_clave"))
  .then(b => console.log(Array.from(new Uint8Array(b))
    .map(x => x.toString(16).padStart(2,"0")).join("")));
```

---

## 10 FIXES Obligatorios

Estos fixes deben aplicarse en **TODOS** los módulos PWA del sistema. Son el resultado de bugs recurrentes detectados durante pruebas en Samsung S25.

---

### FIX-001 — `onerror` en IndexedDB

**Problema:** Sin manejador de error, fallos de IDB quedan silenciosos y la app se congela.

```javascript
// ❌ MAL — sin onerror
var request = indexedDB.open("miDB", 1);
request.onsuccess = function(e) { db = e.target.result; };

// ✅ BIEN — con onerror obligatorio
var request = indexedDB.open("miDB", 1);
request.onerror = function(e) {
  alert("❌ Error al abrir la base de datos: " + e.target.errorCode);
};
request.onsuccess = function(e) { db = e.target.result; };
```

---

### FIX-002 — Guard `!db` antes de toda operación IDB

**Problema:** Operaciones sobre `db` cuando aún no está inicializada causan `TypeError`.

```javascript
// ❌ MAL — sin guard
function guardarRegistro(datos) {
  var tx = db.transaction(["registros"], "readwrite");
}

// ✅ BIEN — con guard obligatorio
function guardarRegistro(datos) {
  if (!db) {
    alert("⚠️ Base de datos no disponible. Recargue la página.");
    return;
  }
  var tx = db.transaction(["registros"], "readwrite");
}
```

---

### FIX-003 — Null-check en registros recuperados

**Problema:** `get()` puede devolver `undefined` si el registro no existe.

```javascript
// ❌ MAL — sin null-check
request.onsuccess = function(e) {
  var registro = e.target.result;
  document.getElementById("campo").value = registro.valor; // TypeError si undefined
};

// ✅ BIEN — con null-check
request.onsuccess = function(e) {
  var registro = e.target.result;
  if (!registro) {
    alert("⚠️ Registro no encontrado.");
    return;
  }
  document.getElementById("campo").value = registro.valor;
};
```

---

### FIX-004 — Canvas medido desde `sig-wrap` (padre)

**Problema:** Medir el canvas por sí mismo antes de renderizar retorna 0x0.

```javascript
// ❌ MAL — medir el canvas directamente
var canvas = document.getElementById("firma-canvas");
canvas.width  = canvas.offsetWidth;   // 0 antes de layout
canvas.height = canvas.offsetHeight;

// ✅ BIEN — medir desde el contenedor padre
function ajustarCanvas() {
  var wrap = document.getElementById("sig-wrap");
  var canvas = document.getElementById("firma-canvas");
  canvas.width  = wrap.offsetWidth;
  canvas.height = wrap.offsetHeight;
}
```

---

### FIX-005 — `setTimeout` 150ms antes de `initCanvas`

**Problema:** En S25, el DOM no ha terminado de renderizar cuando se llama `initCanvas` en `DOMContentLoaded`.

```javascript
// ❌ MAL — llamar inmediatamente
document.addEventListener("DOMContentLoaded", function() {
  initCanvas();
});

// ✅ BIEN — con delay de 150ms
document.addEventListener("DOMContentLoaded", function() {
  setTimeout(ajustarCanvas, 150);
  setTimeout(initCanvas, 200);
});
```

---

### FIX-006 — `drawImage` con dimensiones explícitas

**Problema:** `drawImage(img, 0, 0)` sin dimensiones distorsiona la imagen si el canvas fue redimensionado.

```javascript
// ❌ MAL — sin dimensiones
ctx.drawImage(img, 0, 0);

// ✅ BIEN — con dimensiones explícitas del canvas
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
```

**Al cargar firma guardada desde IDB:**
```javascript
// Forzar resize al tamaño real del contenedor ANTES de drawImage
ajustarCanvas();
setTimeout(function() {
  var img = new Image();
  img.onload = function() {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = firmaDataURL;
}, 50);
```

---

### FIX-007 — `try/catch` en `JSON.parse` al importar

**Problema:** JSON malformado en importación crashea la app sin mensaje de error.

```javascript
// ❌ MAL — sin try/catch
function importarJSON(texto) {
  var datos = JSON.parse(texto);
  procesarDatos(datos);
}

// ✅ BIEN — con try/catch
function importarJSON(texto) {
  try {
    var datos = JSON.parse(texto);
    if (!Array.isArray(datos)) throw new Error("Formato inválido");
    procesarDatos(datos);
  } catch(e) {
    alert("❌ Error al importar: archivo JSON inválido o corrupto.\n" + e.message);
  }
}
```

---

### FIX-008 — Limpiar TODOS los campos en `nuevo()`

**Problema:** Campos olvidados en `nuevo()` mezclan datos entre registros.

```javascript
// ✅ BIEN — checklist exhaustivo para nuevo()
function nuevo() {
  // Campos de texto
  document.getElementById("campo1").value = "";
  document.getElementById("campo2").value = "";
  document.getElementById("select1").value = "opcion_default";

  // Canvas de firmas
  var ctx1 = document.getElementById("canvas-firma1").getContext("2d");
  ctx1.clearRect(0, 0, canvas1.width, canvas1.height);

  // Variables de estado
  registroActual = null;
  estadoActual = "EMISION";

  // Botones según estado inicial
  actualizarBotones("EMISION");

  // Reajustar canvas
  setTimeout(ajustarCanvas, 150);
}
```

---

### FIX-009 — Validar campos obligatorios por paso

**Problema:** Avanzar pasos sin validar permite guardar registros incompletos.

```javascript
// ✅ BIEN — validación por paso antes de avanzar
function avanzarPaso(numeroPaso) {
  var errores = [];

  if (numeroPaso >= 1) {
    if (!document.getElementById("nombre").value.trim())
      errores.push("Nombre es obligatorio");
    if (!document.getElementById("fecha").value)
      errores.push("Fecha es obligatoria");
  }

  if (numeroPaso >= 2) {
    var canvas = document.getElementById("firma-canvas");
    if (esCanvasVacio(canvas))
      errores.push("Firma es obligatoria");
  }

  if (errores.length > 0) {
    alert("⚠️ Complete los campos requeridos:\n• " + errores.join("\n• "));
    return false;
  }
  return true;
}

function esCanvasVacio(canvas) {
  var ctx = canvas.getContext("2d");
  var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  return pixels.every(function(p) { return p === 0; });
}
```

---

### FIX-010 — Resize listener para rotación pantalla S25

**Problema:** Al rotar el S25, el canvas pierde dimensiones y las firmas quedan distorsionadas.

```javascript
// ✅ BIEN — listener de resize con debounce
var resizeTimer;
window.addEventListener("resize", function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    ajustarCanvas();
    // Si hay firma guardada, redibujarla
    if (firmaGuardada) {
      var img = new Image();
      img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = firmaGuardada;
    }
  }, 200);
});

// También escuchar orientationchange para S25
window.addEventListener("orientationchange", function() {
  setTimeout(ajustarCanvas, 300);
});
```

---

## Convenciones de Código

### CSS — Impresión PDF

```css
/* OBLIGATORIO en todo elemento con color de fondo en PDF */
.estado-emision {
  background: #f39c12 !important;
  border: 2px solid #000 !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
```

### JS — Impresión con modal (evitar pantalla blanca S25)

```javascript
// ❌ MAL — imprimir inmediatamente
function generarPDF() {
  actualizarVistaImpresion();
  window.print();  // Pantalla blanca en S25
}

// ✅ BIEN — modal + setTimeout mínimo 700ms
function generarPDF() {
  actualizarVistaImpresion();
  mostrarModalImprimiendo();         // Mostrar modal antes
  setTimeout(function() {
    window.print();
    cerrarModalImprimiendo();        // Cerrar modal después
  }, 700);                           // Mínimo 700ms, idealmente 1000ms
}
```

### JS — WhatsApp sharing

```javascript
// Siempre usar wa.me (nunca api.whatsapp.com)
function compartirWhatsApp(mensaje) {
  var url = "https://wa.me/?text=" + encodeURIComponent(mensaje);
  window.open(url, "_blank");
}
```

### JS — Estados de custodias (Poseidón / Vales)

```
EN EMISIÓN (amarillo  #f39c12) → EN CUSTODIA (rojo  #e74c3c)
         → EN DEVOLUCIÓN (naranja #e67e22) → CERRADO (verde #2ecc71)
```

Reglas:
- **NUNCA** auto-limpiar pantalla al guardar
- Cambiar botones visibles según estado actual
- El usuario limpia manualmente con `nuevo()`

### JS — QR en PDFs

```javascript
// Siempre URLs completas (no texto plano) para compatibilidad
const QR_BASE_URL = "https://vgarcesb-cpu.github.io/Poseidon-s-Seal/";
const qrContent   = QR_BASE_URL + "?id=" + registroId;

// Tamaño estándar QR en PDF
const QR_SIZE = 120;  // 120x120px
```

---

## TODO / Roadmap

### 🔴 ALTA PRIORIDAD

- [ ] **Poseidón v2.x — PDF sin QR**: Variante de PDF para terceros que reciben vía WhatsApp sin app instalada. Omitir sección QR, mantener todos los campos de datos.
- [ ] **Poseidón v2.x — Google Drive Integration**: Subfolder por mes (`YYYY-MM/`), upload automático al cerrar custodia (estado CERRADO), credenciales OAuth en Service Worker.
- [ ] **Poseidón v2.x — Botones por estado**: Revisar layout de botones para cada estado del flujo EN EMISIÓN → EN CUSTODIA → EN DEVOLUCIÓN → CERRADO. Ocultar/mostrar según estado activo.
- [ ] **index.html — Activar www CNAME proxy**: El CNAME `www.totis.cl` está en modo DNS-only en Cloudflare. Pendiente activar proxy para que quede protegido por Zero Trust Access.

### 🟡 MEDIA PRIORIDAD

- [ ] **Módulo Bajas**: Nuevo módulo para baja de equipos/materiales. Formulario con PDF institucional, firma digital, QR de trazabilidad. Integrar al hub index.html.
- [ ] **Estadísticas en index.html**: Actualmente lee de `localStorage`. Migrar a IndexedDB centralizado que agregue datos de todos los módulos. Mostrar gráfico semanal/mensual.
- [ ] **Service Worker — Cache versioning**: Implementar versionado explícito del SW (`CACHE_VERSION = "v2.0"`) con limpieza de caches anteriores en `activate`.
- [ ] **Bitácora — Export PDF**: Agregar botón de exportación PDF mensual al módulo `bitacora.html`.
- [ ] **Personal — Reporte diario**: Generar PDF de control de personal por fecha desde `personal.html`.

### 🟢 BAJA PRIORIDAD / MEJORAS

- [ ] **Dark/Light mode**: Toggle en header de `index.html`. Usar CSS variables (`--azul`, `--blanco`) ya implementadas como base.
- [ ] **Notificaciones Push**: Service Worker con Push API para alertas de mantención preventiva vencida.
- [ ] **WD MyCloud — Sync bidireccional**: Actualmente Poseidón solo sube (PUT). Implementar GET para consultar custodias desde otros dispositivos en la red local.
- [ ] **Buscador global**: Campo de búsqueda en el hub que consulte IndexedDB de todos los módulos locales y retorne resultados unificados.
- [ ] **icon-512.png real**: El ícono actual es un base64 embebido en JS. Crear PNG real 512x512 con el escorpión AGA y moverlo a `icon-512.png` en el repo.
- [ ] **Offline fallback page**: Agregar `/offline.html` al Service Worker. Mostrarla cuando no hay red y el recurso no está en cache.

### 🔧 DEUDA TÉCNICA

- [ ] **Unificar estilos CSS**: Variables `--dorado`, `--azul`, `--verde` etc. definidas en cada módulo independientemente. Extraer a `styles-aga.css` compartido vía CDN propio o import.
- [ ] **Módulo "proximamente"**: La card `➕ Más módulos en camino...` muestra `onclick="proximamente()"`. Reemplazar por grid real con módulos planificados (Bajas, Búsqueda global).
- [ ] **sessionStorage vs localStorage**: Estandarizar uso. `sessionStorage` para auth, `localStorage` para datos persistentes entre sesiones.
- [ ] **Error boundary global**: Agregar `window.onerror` y `window.onunhandledrejection` para capturar errores no manejados y mostrar mensaje amigable en S25.

---

## Historial de Versiones

### v2.0 (actual)
- ✅ Hub centralizado con 9 módulos
- ✅ Login SHA-256 con `crypto.subtle` (Capa 2)
- ✅ Cloudflare Zero Trust Access (Capa 1)
- ✅ DNS `totis.cl` con 4 A records proxiados
- ✅ Stats dinámicas en dashboard (adquisiciones + vales)
- ✅ Módulos: Mantención, Bitácora, Inventario, Presupuesto, Personal, Informes, Informe Técnico
- ✅ Integración Poseidón v2.0.0 (QR scanner, WD MyCloud, firmas, 4 estados)

### v1.x
- ✅ Single HTML con login overlay (sin SHA-256)
- ✅ Módulos: Solicitud Adquisición, Vale de Entrega
- ✅ GitHub Pages + dominio `totis.cl` vía NIC Chile → Cloudflare
- ✅ Bitácora técnica de configuración DNS generada

---

## Contacto y Repositorios

| Recurso | URL |
|---|---|
| Hub principal | https://totis.cl |
| GitHub Account | https://github.com/vgarcesb-cpu |
| Scorpion Tail repo | https://github.com/vgarcesb-cpu/scorpion-tail |
| Poseidón repo | https://github.com/vgarcesb-cpu/Poseidon-s-Seal |
| Vale de Entrega repo | https://github.com/vgarcesb-cpu/vale-de-entrega |
| Solicitud FACH repo | https://github.com/vgarcesb-cpu/solicitud-fach |

---

*🦂 PROYECTO SCORPION TAIL · Academia de Guerra Aérea FACH · Desarrollado por Toti's® · v2.0*
