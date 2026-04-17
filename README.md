# 🦂 PROYECTO SCORPION TAIL — README TÉCNICO COMPLETO
**Academia de Guerra Aérea · Fuerza Aérea de Chile**
`v2.1` · Desarrollado por Toti's® (Víctor Manuel Garcés Borje) · Systems Technician AGA

---

## 📋 ÍNDICE
1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Flujo de Desarrollo Obligatorio](#flujo-de-desarrollo-obligatorio)
5. [Módulos Activos](#módulos-activos)
6. [Sistema de Login SHA-256](#sistema-de-login-sha-256)
7. [10 FIXES Obligatorios](#10-fixes-obligatorios)
8. [Convenciones de Código](#convenciones-de-código)
9. [TODO / Roadmap](#todo--roadmap)
10. [Historial de Versiones](#historial-de-versiones)

---

## Descripción General

**Scorpion Tail** es el sistema de gestión institucional de la Academia de Guerra Aérea (AGA), FACH. Es una suite de PWA (Progressive Web Apps) de arquitectura **single-file** que centraliza módulos operativos del área de Sistemas: custodias de materiales, adquisiciones, vales de entrega, equipos de transferencia de calor, mantención, bitácora, inventario, presupuesto, control de personal e informes.

El sistema está protegido por **dos capas de seguridad**:
- **Capa 1 (Cloudflare Zero Trust Access)**: control perimetral vía email PIN en `totis.cl`
- **Capa 2 (SHA-256 Login)**: autenticación interna en `index.html` con hash de contraseña via `crypto.subtle`

Acceso público (autenticado): `https://totis.cl` → redirige a `https://vgarcesb-cpu.github.io/scorpion-tail/`

> **v2.1**: Todos los módulos PWA principales están consolidados en este único repositorio. Los repos externos anteriores (`solicitud-fach`, `vale-de-entrega`, `Poseidon-s-Seal`, `NLS-2003-004`) han sido migrados como archivos `.html` independientes en la raíz del monorepo.

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
│   │  index.html        ← Login + Root redirect  │    │
│   │  portal/           ← Hub central (dashboard) │    │
│   │                                              │    │
│   │  ── MÓDULOS PWA ACTIVOS ──────────────────── │    │
│   │  poseidon.html     ← Custodias / Materiales  │    │
│   │  solicitud.html    ← Solicitud Adquisición   │    │
│   │  vale.html         ← Vale de Entrega         │    │
│   │  nls.html          ← NLS-2003-004 (Calor)    │    │
│   │                                              │    │
│   │  ── MÓDULOS LEGACY (en repo) ─────────────── │    │
│   │  mantencion.html   bitacora.html             │    │
│   │  inventario.html   presupuesto.html          │    │
│   │  personal.html     informes.html             │    │
│   │  informe.html                                │    │
│   └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

> ⚠️ **Nota de migración**: Los repos independientes `solicitud-fach`, `vale-de-entrega`, `Poseidon-s-Seal` y `NLS-2003-004` siguen existiendo en GitHub pero están **desactualizados**. La versión canónica de cada módulo es la que reside en este repo.

**Stack tecnológico:**
- HTML5 + CSS3 + Vanilla JS (sin frameworks)
- IndexedDB para persistencia local (guards FIX-001/002/003 obligatorios)
- Service Worker inline (Blob URL, sin `sw.js` externo)
- Manifest PWA inline (Blob URL, sin `manifest.json` externo)
- Web Crypto API (`crypto.subtle`) para hashing SHA-256
- `sessionStorage` para control de sesión en `index.html`
- CDN: QRCode.js (cdnjs 1.0.0), Html5-QRCode (unpkg 2.3.8)

---

## Estructura de Archivos

```
scorpion-tail/
│
├── index.html            ← Login SHA-256 + redirect al portal
├── CNAME                 ← totis.cl → GitHub Pages
├── README.md             ← Este archivo
│
├── portal/
│   └── index.html        ← Hub central: dashboard, cards de módulos, stats
│
├── ── MÓDULOS PWA ACTIVOS (single-file, SW+manifest inline) ──────────────
│
├── poseidon.html         ← Sello Poseidón v2.0.1: custodias de materiales
│   │                        IDB: PoseidonDB v2 · 4 estados · firmas canvas
│   │                        QR scanner · WhatsApp · JSON export/import · MyCloud
│
├── solicitud.html        ← Solicitud Adquisición Supervisor
│   │                        IDB: SolicitudAGA v1 · Folios ADQ-{AÑO}-{NNNN}
│   │                        Canvas firmas · PDF print · 4 pasos wizard
│
├── vale.html             ← Vale de Entrega
│   │                        IDB: ValeEntregaDB v1 · QR trazabilidad
│   │                        3 firmas · PDF institucional
│
├── nls.html              ← NLS-2003-004: Equipos Transferencia de Calor
│   │                        IDB: NLS2003004v2 · 6 tipos de equipo (Anexos A-F)
│   │                        Catastro · Hojas de vida · Bitácoras · Gantt
│   │                        Informes Cmd Logístico · Alertas SESMA/Montreal
│
├── ── MÓDULOS LEGACY (en repo, sin refactoring PWA completo) ─────────────
│
├── mantencion.html       ← Check List Mantención
├── bitacora.html         ← Bitácora de Novedades
├── inventario.html       ← Inventario Repuestos
├── presupuesto.html      ← Saldo Presupuesto (estilo DIPRES)
├── personal.html         ← Control Personal (salida/entrada)
├── informes.html         ← Informes y Reportes (resumen ejecutivo)
└── informe.html          ← Informe Técnico (fallas y accidentes)
```

---

## Flujo de Desarrollo Obligatorio

> ⚠️ **REGLA DE ORO**: Nunca asumir que algo funciona sin pasar las 3 etapas.

```
ETAPA 1 — DESARROLLO (Mac)
  ├─ Editor: VS Code en español
  ├─ Prueba: Chrome DevTools + Safari
  ├─ Git: commit + push a main
  └─ Preferencia: GitHub browser interface sobre Terminal

         ↓ GitHub Pages auto-deploy (~30s)

ETAPA 2 — VALIDACIÓN PÚBLICA (GitHub Pages)
  ├─ URL: https://vgarcesb-cpu.github.io/scorpion-tail/
  ├─ Verificar: consola sin errores, flujos completos
  ├─ Verificar: PDF, firmas canvas, IndexedDB
  └─ Verificar: PWA instalable (manifest + SW activos)

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
| Mac (Chrome/Safari + Git) | Desarrollo principal | GitHub Pages |
| GitHub Pages | Validación pública | vgarcesb-cpu.github.io/scorpion-tail/ |
| Samsung S25 | Juez definitivo en terreno | totis.cl |
| Windows PC | Consulta / impresión en oficina | totis.cl |
| WD MyCloud NAS | Sync automático red local WiFi | API REST local |

---

## Módulos Activos

### ✅ Módulos PWA — producción en monorepo

| Módulo | Archivo | IDB Store | Estado | Versión |
|---|---|---|---|---|
| Sello Poseidón | `poseidon.html` | PoseidonDB v2 | ✅ Activo | v2.0.1 |
| Solicitud Adquisición | `solicitud.html` | SolicitudAGA v1 | ✅ Activo | v1.x |
| Vale de Entrega | `vale.html` | ValeEntregaDB v1 | ✅ Activo | v1.x |
| NLS-2003-004 · Calor | `nls.html` | NLS2003004v2 | ✅ Activo | v2.0 |

### 📦 Módulos legacy en repo (sin migración PWA completa)

| Módulo | Archivo | Función |
|---|---|---|
| Check List Mantención | `mantencion.html` | Preventivo y correctivo |
| Bitácora | `bitacora.html` | Registro de novedades |
| Inventario Repuestos | `inventario.html` | Control de stock |
| Saldo Presupuesto | `presupuesto.html` | Control tipo DIPRES |
| Control Personal | `personal.html` | Salida/entrada unidad |
| Informes y Reportes | `informes.html` | Resumen ejecutivo |
| Informe Técnico | `informe.html` | Fallas y accidentes |

### 📊 Portal Hub (`portal/index.html`)

Dashboard central con cards de módulos, filtros por estado y estadísticas en tiempo real. Estados de módulos:
- `activo` — PWA completa, en producción
- `nuevo` — en desarrollo / pendiente de refactoring
- `pronto` — planificado
- `inactivo` — deshabilitado temporalmente

### 🔥 NLS-2003-004 — Detalle técnico

Módulo normativo para gestión de equipos de transferencia de calor según NLS-2003-004 Rev.2.0 (17.Sept.2008).

**6 tipos de equipo con campos por Anexo:**

| Tipo | Anexo Unidad | Anexo CL | Umbral Responsabilidad |
|---|---|---|---|
| Aire Acondicionado | A | G | ≥ 40.000 BTU/HRS → Cmd Logístico |
| Caldera | B | H | ≥ 10.083 Kcal/H → Cmd Logístico |
| Cámara Frigorífica | C | I | Siempre Cmd Logístico |
| Refrigerador Industrial | D | J | Siempre Cmd Logístico |
| Ventilador Alto Caudal | E | K | Siempre Cmd Logístico |
| Incinerador | F | L | Siempre Cmd Logístico |

**Alertas legales automáticas:**
- DS Nº 48: Calderas/Incineradores sin inscripción SESMA
- Protocolo de Montreal: Gas refrigerante R-22 prohibido

**Obligaciones normativas gestionadas:**
- Catastro inicial (30 días desde recepción norma)
- Informe anual noviembre al Cmd Logístico (Anexos G–L)
- Alta inmediata de equipo nuevo (Anexo A–F)
- Protocolo de Mantención de Depósito (autorización previa CL)

---

## Sistema de Login SHA-256

```javascript
// CREDENCIALES EN PRODUCCIÓN
var U = "victor";          // Usuario en texto plano
var H = "5c10b00d...";     // Hash SHA-256 de la contraseña

// FLUJO DE VERIFICACIÓN
async function verificarLogin() {
  var buf = await crypto.subtle.digest("SHA-256",
              new TextEncoder().encode(passwordIngresada));
  var hex = Array.from(new Uint8Array(buf))
              .map(b => b.toString(16).padStart(2,"0")).join("");
  if (u === U && hex === H) {
    sessionStorage.setItem("st_auth", "ok");
    mostrarApp();
  } else {
    mostrarError();
  }
}

// PERSISTENCIA DE SESIÓN
if (sessionStorage.getItem("st_auth") === "ok") mostrarApp();
```

**Generar nuevo hash SHA-256 (consola Chrome):**
```javascript
crypto.subtle.digest("SHA-256", new TextEncoder().encode("nueva_clave"))
  .then(b => console.log(Array.from(new Uint8Array(b))
    .map(x => x.toString(16).padStart(2,"0")).join("")));
```

**Token GitHub Personal Access Token:**
- Nombre: `Vale_Entrega Mac`
- Scope: `repo`
- Expiración: 90 días desde creación
- Renovar en: GitHub → Profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

---

## 10 FIXES Obligatorios

Estos fixes deben aplicarse en **TODOS** los módulos PWA del sistema. Son el resultado de bugs recurrentes detectados durante pruebas en Samsung S25.

### FIX-001 — `onerror` en IndexedDB
```javascript
var request = indexedDB.open("miDB", 1);
request.onerror = function(e) {
  alert("❌ Error al abrir la base de datos: " + e.target.errorCode);
};
request.onsuccess = function(e) { db = e.target.result; };
```

### FIX-002 — Guard `!db` antes de toda operación IDB
```javascript
function guardarRegistro(datos) {
  if (!db) { alert("⚠️ Base de datos no disponible."); return; }
  var tx = db.transaction(["registros"], "readwrite");
}
```

### FIX-003 — Null-check en registros recuperados
```javascript
request.onsuccess = function(e) {
  var registro = e.target.result;
  if (!registro) { alert("⚠️ Registro no encontrado."); return; }
  document.getElementById("campo").value = registro.valor;
};
```

### FIX-004 — Canvas medido desde `sig-wrap` (padre)
```javascript
function ajustarCanvas() {
  var wrap = document.getElementById("sig-wrap");
  canvas.width  = wrap.offsetWidth;
  canvas.height = wrap.offsetHeight;
}
```

### FIX-005 — `setTimeout` 150ms antes de `initCanvas`
```javascript
document.addEventListener("DOMContentLoaded", function() {
  setTimeout(ajustarCanvas, 150);
  setTimeout(initCanvas, 200);
});
```

### FIX-006 — `drawImage` con dimensiones explícitas
```javascript
// Al cargar firma guardada: resize ANTES de drawImage
ajustarCanvas();
setTimeout(function() {
  var img = new Image();
  img.onload = function() { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
  img.src = firmaDataURL;
}, 50);
```

### FIX-007 — `try/catch` en `JSON.parse` al importar
```javascript
function importarJSON(texto) {
  try {
    var datos = JSON.parse(texto);
    if (!Array.isArray(datos)) throw new Error("Formato inválido");
    procesarDatos(datos);
  } catch(e) {
    alert("❌ Error al importar: " + e.message);
  }
}
```

### FIX-008 — Limpiar TODOS los campos en `nuevo()`
```javascript
function nuevo() {
  document.getElementById("campo1").value = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  registroActual = null;
  estadoActual = "EMISION";
  actualizarBotones("EMISION");
  setTimeout(ajustarCanvas, 150);
}
```

### FIX-009 — Validar campos obligatorios por paso
```javascript
function avanzarPaso(n) {
  var errores = [];
  if (!document.getElementById("nombre").value.trim())
    errores.push("Nombre es obligatorio");
  if (errores.length > 0) {
    alert("⚠️ Complete:\n• " + errores.join("\n• "));
    return false;
  }
  return true;
}
```

### FIX-010 — Resize listener para rotación pantalla S25
```javascript
window.addEventListener("resize", function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(ajustarCanvas, 200);
});
window.addEventListener("orientationchange", function() {
  setTimeout(ajustarCanvas, 300);
});
```

---

## Convenciones de Código

### CSS — Impresión PDF

```css
.estado-emision {
  background: #f39c12 !important;
  border: 2px solid #000 !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
```

### JS — Impresión con modal (evitar pantalla blanca S25)

```javascript
function generarPDF() {
  actualizarVistaImpresion();
  mostrarModalImprimiendo();
  setTimeout(function() {
    window.print();
    cerrarModalImprimiendo();
  }, 700); // mínimo 700ms, idealmente 1000ms
}
```

### JS — Service Worker y Manifest inline (patrón v2.1)

```javascript
// Sin sw.js ni manifest.json externos — todo embebido en el HTML
(function(){
  var m = { name:'Modulo AGA', start_url:'/scorpion-tail/modulo.html',
    display:'standalone', background_color:'#003087', theme_color:'#003087' };
  var b = new Blob([JSON.stringify(m)], {type:'application/json'});
  document.getElementById('manifest-link').href = URL.createObjectURL(b);
})();

if ('serviceWorker' in navigator) {
  var sw = "const C='aga-v1';\n" +
    "self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.add('.'))));\n" +
    "self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));";
  navigator.serviceWorker.register(URL.createObjectURL(
    new Blob([sw], {type:'application/javascript'})), {scope:'./'});
}
```

### JS — WhatsApp sharing

```javascript
function compartirWhatsApp(mensaje) {
  var url = "https://wa.me/?text=" + encodeURIComponent(mensaje);
  window.open(url, "_blank");
}
```

### JS — Estados de custodias (Poseidón / Vales)

```
EN EMISIÓN (amarillo #f39c12) → EN CUSTODIA (rojo #e74c3c)
         → EN DEVOLUCIÓN (naranja #e67e22) → CERRADO (verde #2ecc71)
```

Reglas: NUNCA auto-limpiar pantalla al guardar. El usuario limpia con `nuevo()`.

---

## TODO / Roadmap

### 🔴 ALTA PRIORIDAD

- [ ] **Poseidón — PDF sin QR (P-1)**: Variante de PDF para terceros vía WhatsApp. Omitir sección QR, mantener todos los campos de datos.
- [ ] **Poseidón — Google Drive Integration (P-2)**: Subfolder por año/mes (`YYYY/MM/`), upload automático al estado CERRADO, OAuth2 PKCE.
- [ ] **index.html — Activar www CNAME proxy**: El CNAME `www.totis.cl` está en modo DNS-only en Cloudflare. Pendiente activar proxy para Zero Trust Access.
- [ ] **Archivar repos externos**: Marcar como archived en GitHub los repos `solicitud-fach`, `vale-de-entrega`, `Poseidon-s-Seal`, `NLS-2003-004`. Agregar aviso de migración en su README.

### 🟡 MEDIA PRIORIDAD

- [ ] **Módulo Bajas**: Formulario con PDF institucional, firma digital, QR de trazabilidad.
- [ ] **Estadísticas en portal/index.html**: Migrar de `localStorage` a lectura directa de IDB de cada módulo. Gráfico semanal/mensual.
- [ ] **Módulos legacy → migración PWA**: Aplicar los 10 FIXES y el patrón inline SW+manifest a `mantencion.html`, `bitacora.html`, `inventario.html`, `presupuesto.html`, `personal.html`, `informes.html`, `informe.html`.
- [ ] **Bitácora — Export PDF mensual**.
- [ ] **Personal — Reporte diario PDF**.

### 🟢 BAJA PRIORIDAD

- [ ] **Dark/Light mode**: Toggle en portal. CSS variables base ya implementadas.
- [ ] **Notificaciones Push**: SW con Push API para alertas de mantención vencida (NLS).
- [ ] **WD MyCloud — Sync bidireccional**: GET para consultar desde otros dispositivos en red local.
- [ ] **Buscador global**: Campo en portal que consulte IDB de todos los módulos.
- [ ] **Offline fallback page**: `/offline.html` en SW, mostrar cuando no hay red.

### 🔧 DEUDA TÉCNICA

- [ ] **Acentos en strings JS de nls.html**: Los labels internos de TIPOS/CAMP en el JS quedaron sin caracteres especiales por limitaciones del proceso de migración. Cosmético, no afecta lógica.
- [ ] **Unificar estilos CSS**: Variables `--dorado`, `--azul`, `--verde` definidas en cada módulo. Extraer a `styles-aga.css` compartido.
- [ ] **Error boundary global**: `window.onerror` + `window.onunhandledrejection` para S25.
- [ ] **SW scope unificado**: Actualmente cada módulo tiene su SW independiente. Evaluar SW maestro en raíz del repo.

---

## Historial de Versiones

### v2.1 (actual — Abril 2026)
- ✅ Migración completa al monorepo: `poseidon.html`, `solicitud.html`, `vale.html`, `nls.html`
- ✅ Portal hub centralizado (`portal/index.html`) con cards de módulos
- ✅ Patrón SW + manifest inline en todos los módulos migrados
- ✅ Fixes de compatibilidad S25: `position:fixed`, `100dvh`, `viewport-fit:cover`
- ✅ NLS-2003-004 v2.0: catastro, hojas de vida, bitácoras, Gantt, informes CL, alertas SESMA/Montreal
- ✅ Poseidón v2.0.1: fix `const sb` SyntaxError + 4 fixes adicionales

### v2.0
- ✅ Hub centralizado con 9 módulos legacy
- ✅ Login SHA-256 con `crypto.subtle` (Capa 2)
- ✅ Cloudflare Zero Trust Access (Capa 1)
- ✅ DNS `totis.cl` con 4 A records proxiados
- ✅ Integración Poseidón v2.0.0 (QR scanner, WD MyCloud, firmas, 4 estados)

### v1.x
- ✅ Single HTML con login overlay
- ✅ Módulos: Solicitud Adquisición, Vale de Entrega
- ✅ GitHub Pages + dominio `totis.cl`

---

## Contacto y Repositorios

| Recurso | URL |
|---|---|
| Hub principal | https://totis.cl |
| GitHub Account | https://github.com/vgarcesb-cpu |
| Scorpion Tail (monorepo) | https://github.com/vgarcesb-cpu/scorpion-tail |
| Poseidón (legacy, archivado) | https://github.com/vgarcesb-cpu/Poseidon-s-Seal |
| Vale de Entrega (legacy) | https://github.com/vgarcesb-cpu/vale-de-entrega |
| Solicitud FACH (legacy) | https://github.com/vgarcesb-cpu/solicitud-fach |
| NLS-2003-004 (legacy) | https://github.com/vgarcesb-cpu/NLS-2003-004 |

---

*🦂 PROYECTO SCORPION TAIL · Academia de Guerra Aérea FACH · Desarrollado por Toti's® · v2.1 · Abril 2026*

---

## 📋 Sesión 16 Abril 2026 — Correcciones Impresión y Contador Folios

### Encabezado Universal AGA

Estándar definido para todos los módulos con impresión:

```
FUERZA AÉREA DE CHILE        ← centrado
DIVISIÓN DE EDUCACIÓN        ← centrado
ACADEMIA DE GUERRA AÉREA     ← centrado + subrayado
```

**Especificaciones:** Arial 12px · line-height 16px · text-align center · Academia subrayada · bloque izquierda página

```html
<!-- ENCABEZADO UNIVERSAL AGA — copiar en todo módulo con impresión -->
<div style="margin-bottom:12px;display:inline-block;padding-left:5px">
  <div style="font-family:Arial,sans-serif;font-size:12px;line-height:16px;color:#000;text-align:center">FUERZA AÉREA DE CHILE</div>
  <div style="font-family:Arial,sans-serif;font-size:12px;line-height:16px;color:#000;text-align:center">DIVISIÓN DE EDUCACIÓN</div>
  <div style="font-family:Arial,sans-serif;font-size:12px;line-height:16px;color:#000;text-align:center;text-decoration:underline">ACADEMIA DE GUERRA AÉREA</div>
</div>
```

**CSS @page estándar:**
```css
@media print {
  @page { size: letter portrait; margin: 10mm 20mm 15mm 20mm; }
  #print-area { display: block !important; padding: 0; margin-top: 0; font-family: Arial, sans-serif; color: #000; }
}
```

**Configuración Chrome Mac para imprimir:**

| Ajuste | Valor |
|--------|-------|
| Tamaño papel | Letter |
| Márgenes | Predeterminados |
| Encabezado y pie de página | **Desactivado** |
| Gráficos de fondo | Activado |

---

### Fix Contador Folios — `solicitud.html`

**Problema:** Al cargar un registro del historial para imprimir y luego presionar `+ Nuevo`, el folio no incrementaba — se quedaba pegado en el mismo número.

**Causa:** `nuevoFormulario()` dependía del contador IDB que quedaba desincronizado al cargar registros del historial.

**Solución:** Calcular el siguiente folio leyendo el número más alto del historial en memoria:

```javascript
// ANTES — fallaba
getFolio(function(actual){
  document.getElementById('folio-num').value = folioStr(actual + 1);
});

// DESPUÉS — confiable
function getNextFolioNum(){
  var max = 0;
  solicitudes.forEach(function(s){
    var n = parseInt(s.folioNum) || 0;
    if(n > max) max = n;
  });
  return max;
}
// nuevoFormulario() usa: folioStr(getNextFolioNum() + 1)
```

**Resultado verificado:** Cargar 0001 o 0002 del historial → imprimir → presionar Nuevo → muestra **0003** ✅

---

### Archivos actualizados esta sesión

| Archivo | Cambio |
|---------|--------|
| `solicitud.html` | Encabezado universal AGA · fix contador folios · @page 10mm |
| `vale.html` | Encabezado universal AGA |
| `poseidon.html` | Encabezado universal AGA |
| `nls.html` | Migrado al monorepo desde repo independiente |
| `portal/index.html` | NLS activado como módulo activo v2.0 |
| `README.md` | Actualizado a v2.1 |

