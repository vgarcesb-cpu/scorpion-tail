/**
 * st-drive.js — Scorpion Tail · Google Drive Sync Module
 * Proyecto: Scorpion Tail · AGA · FACH · Toti's®
 *
 * API pública:
 *   STDrive.isConnected()
 *   STDrive.login(returnUrl)
 *   STDrive.logout()
 *   STDrive.guardar(modulo, id, data)   → Promise (SUBIDA)
 *   STDrive.descargar(modulo, prefix, cb) → Promise (SYNC-001 BAJADA)
 *   STDrive.mostrarIndicador(estado)
 */

var STDrive = (function(){

  var CLIENT_ID   = '865991409359-pjqdqiuhio5gicq4j4sbresqa7i32g56.apps.googleusercontent.com';
  var SCOPES      = 'https://www.googleapis.com/auth/drive.file';
  var REDIRECT    = 'https://vgarcesb-cpu.github.io/scorpion-tail/auth.html';
  var FOLDER_NAME = 'ScorpionTail';

  // ─── TOKEN ───────────────────────────────────────────────────────────────────
  function getToken() {
    var t = localStorage.getItem('st_gtoken');
    var e = parseInt(localStorage.getItem('st_gexpiry') || '0');
    if (t && Date.now() < e) return t;
    return null;
  }

  function isConnected() { return !!getToken(); }

  // ─── PKCE ────────────────────────────────────────────────────────────────────
  function randomB64(len) {
    var arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode.apply(null, arr))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  }

  function sha256B64(plain) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
      .then(function(buf) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)))
          .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
      });
  }

  function login(returnUrl) {
    sessionStorage.setItem('st_return', returnUrl || window.location.href);
    var verifier = randomB64(64);
    sessionStorage.setItem('st_cv', verifier);
    sha256B64(verifier).then(function(challenge) {
      var url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
        new URLSearchParams({
          client_id:             CLIENT_ID,
          redirect_uri:          REDIRECT,
          response_type:         'code',
          scope:                 SCOPES,
          code_challenge:        challenge,
          code_challenge_method: 'S256',
          access_type:           'offline',
          prompt:                'consent'
        });
      window.location.href = url;
    });
  }

  function logout() {
    localStorage.removeItem('st_gtoken');
    localStorage.removeItem('st_gexpiry');
    localStorage.removeItem('st_grefresh');
  }

  // ─── DRIVE API BASE ──────────────────────────────────────────────────────────
  function apiCall(url, opts) {
    var token = getToken();
    if (!token) return Promise.reject(new Error('Sin token Drive'));
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, opts).then(function(r) {
      if (!r.ok) return r.json().then(function(e) {
        throw new Error((e.error && e.error.message) || ('HTTP ' + r.status));
      });
      return r.status === 204 ? {} : r.json();
    });
  }

  // Buscar o crear carpeta en Drive
  function getOrCreateFolder(name, parentId) {
    var q = "name='" + name + "' and mimeType='application/vnd.google-apps.folder' and trashed=false" +
      (parentId ? " and '" + parentId + "' in parents" : " and 'root' in parents");
    return apiCall(
      'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q) + '&fields=files(id,name)'
    ).then(function(res) {
      if (res.files && res.files.length > 0) return res.files[0].id;
      return apiCall('https://www.googleapis.com/drive/v3/files', {
        method:  'POST',
        headers: {'Content-Type': 'application/json'},
        body:    JSON.stringify({
          name:     name,
          mimeType: 'application/vnd.google-apps.folder',
          parents:  parentId ? [parentId] : []
        })
      }).then(function(f) { return f.id; });
    });
  }

  // Obtener carpeta: ScorpionTail/YYYY/MM/modulo
  function getModuleFolder(modulo) {
    var now  = new Date();
    var yyyy = String(now.getFullYear());
    var mm   = String(now.getMonth() + 1).padStart(2, '0');
    return getOrCreateFolder(FOLDER_NAME)
      .then(function(root)  { return getOrCreateFolder(yyyy, root); })
      .then(function(year)  { return getOrCreateFolder(mm, year); })
      .then(function(month) { return getOrCreateFolder(modulo, month); });
  }

  // Subir o actualizar archivo JSON
  function uploadJSON(filename, data, modulo) {
    return getModuleFolder(modulo).then(function(folderId) {
      var content = JSON.stringify(data, null, 2);
      var blob    = new Blob([content], {type: 'application/json'});
      var q       = "name='" + filename + "' and '" + folderId + "' in parents and trashed=false";
      return apiCall(
        'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q) + '&fields=files(id)'
      ).then(function(res) {
        var form = new FormData();
        var meta = {name: filename, mimeType: 'application/json'};
        if (!res.files || res.files.length === 0) {
          meta.parents = [folderId];
          form.append('metadata', new Blob([JSON.stringify(meta)], {type:'application/json'}));
          form.append('file', blob);
          return apiCall(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {method: 'POST', body: form}
          );
        } else {
          var fileId = res.files[0].id;
          var f = new FormData();
          f.append('metadata', new Blob([JSON.stringify({name:filename})], {type:'application/json'}));
          f.append('file', blob);
          return apiCall(
            'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=multipart',
            {method: 'PATCH', body: f}
          );
        }
      });
    });
  }

  // ─── INDICADOR VISUAL ────────────────────────────────────────────────────────
  // El error se muestra con el mensaje completo y dura 10 segundos en pantalla
  function mostrarIndicador(estado, detalle) {
    var el = document.getElementById('st-sync-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'st-sync-indicator';
      el.style.cssText =
        'position:fixed;bottom:60px;right:14px;background:#0a1628;color:#C8A951;' +
        'font-size:11px;font-weight:700;padding:6px 10px;border-radius:20px;' +
        'display:flex;align-items:flex-start;gap:5px;z-index:9998;' +
        'box-shadow:0 2px 8px rgba(0,0,0,.4);transition:opacity .3s;' +
        'font-family:Arial,sans-serif;max-width:280px;line-height:1.4;';
      document.body.appendChild(el);
    }
    if (!document.getElementById('st-sync-style')) {
      var s = document.createElement('style');
      s.id  = 'st-sync-style';
      s.textContent = '@keyframes st-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(s);
    }
    var icono = estado === 'syncing'
      ? '<span style="display:inline-block;animation:st-spin .8s linear infinite;flex-shrink:0">🔄</span>'
      : estado === 'ok' ? '✅' : '❌';
    var texto = estado === 'syncing' ? 'Sincronizando...'
      : estado === 'ok'      ? 'Drive sincronizado'
      : detalle              ? detalle
      : 'Error sync Drive';
    el.innerHTML = icono + ' <span>' + texto + '</span>';
    el.style.opacity = '1';
    // Errores: 10 seg; OK: 3 seg
    if (estado !== 'syncing') {
      setTimeout(function() { el.style.opacity = '0'; }, estado === 'error' ? 10000 : 3000);
    }
  }

  // ─── GUARDAR (SUBIDA) ─────────────────────────────────────────────────────────
  function guardar(modulo, id, data) {
    if (!isConnected()) return Promise.resolve({skip: true});
    mostrarIndicador('syncing');
    var filename = id.replace(/[^a-zA-Z0-9\-_]/g, '_') + '.json';
    return uploadJSON(filename, data, modulo)
      .then(function(res) { mostrarIndicador('ok'); return res; })
      .catch(function(e)  { mostrarIndicador('error', 'Subida: ' + e.message); throw e; });
  }

  // ─── SYNC-001: DESCARGAR (BAJADA) ────────────────────────────────────────────
  function descargar(modulo, filtroPrefijo, onComplete) {
    if (typeof filtroPrefijo === 'function') {
      onComplete    = filtroPrefijo;
      filtroPrefijo = null;
    }

    if (!isConnected()) {
      if (typeof onComplete === 'function') onComplete([], null);
      return Promise.resolve({skip: true});
    }

    mostrarIndicador('syncing');

    return getOrCreateFolder(FOLDER_NAME)
      .then(function(rootId) {
        var q = "mimeType='application/json' and trashed=false and '" + rootId + "' in ancestors";
        if (filtroPrefijo) {
          q += " and name contains '" + filtroPrefijo.replace(/'/g, "\\'") + "'";
        }
        return apiCall(
          'https://www.googleapis.com/drive/v3/files?' +
          new URLSearchParams({q:q, fields:'files(id,name,modifiedTime)', pageSize:'200', orderBy:'name'})
        );
      })
      .then(function(res) {
        var files = res.files || [];
        if (!files.length) {
          mostrarIndicador('ok');
          if (typeof onComplete === 'function') onComplete([], null);
          return [];
        }
        return Promise.all(files.map(function(file) {
          return apiCall('https://www.googleapis.com/drive/v3/files/' + file.id + '?alt=media')
            .then(function(data) {
              return {filename:file.name, modifiedTime:file.modifiedTime,
                      driveMs:new Date(file.modifiedTime).getTime(), data:data};
            })
            .catch(function() { return null; });
        }));
      })
      .then(function(results) {
        var validos = (results || []).filter(Boolean);
        mostrarIndicador('ok');
        if (typeof onComplete === 'function') onComplete(validos, null);
        return validos;
      })
      .catch(function(e) {
        // Muestra el mensaje de error completo en pantalla por 10 segundos
        mostrarIndicador('error', e.message);
        if (typeof onComplete === 'function') onComplete(null, e);
        throw e;
      });
  }

  // ─── API PÚBLICA ──────────────────────────────────────────────────────────────
  return {
    isConnected:      isConnected,
    login:            login,
    logout:           logout,
    guardar:          guardar,
    descargar:        descargar,
    mostrarIndicador: mostrarIndicador
  };

})();
