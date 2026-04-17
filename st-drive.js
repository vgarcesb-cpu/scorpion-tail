/**
 * st-drive.js — Scorpion Tail · Google Drive Sync Module
 * Proyecto: Scorpion Tail · AGA · FACH · Toti's®
 * 
 * Uso: incluir en cualquier módulo con <script src="st-drive.js"></script>
 * o copiar el contenido inline en el HTML del módulo.
 */

var STDrive = (function(){

  var CLIENT_ID = '865991409359-s6dnib021q5kg9b3fbmcfktv1j1fsno0.apps.googleusercontent.com';
  var SCOPES    = 'https://www.googleapis.com/auth/drive.file';
  var REDIRECT  = window.location.origin + '/auth.html';
  var FOLDER_NAME = 'ScorpionTail';

  // ─── TOKEN ───────────────────────────────────────────────
  function getToken(){
    var t = localStorage.getItem('st_gtoken');
    var e = parseInt(localStorage.getItem('st_gexpiry')||'0');
    if(t && Date.now() < e) return t;
    return null;
  }

  function isConnected(){ return !!getToken(); }

  // ─── PKCE ────────────────────────────────────────────────
  function randomB64(len){
    var arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode.apply(null,arr))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  }

  function sha256B64(plain){
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
      .then(function(buf){
        return btoa(String.fromCharCode.apply(null,new Uint8Array(buf)))
          .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
      });
  }

  function login(returnUrl){
    var verifier  = randomB64(64);
    sessionStorage.setItem('st_cv', verifier);
    sessionStorage.setItem('st_return', returnUrl || window.location.href);
    sha256B64(verifier).then(function(challenge){
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

  function logout(){
    localStorage.removeItem('st_gtoken');
    localStorage.removeItem('st_gexpiry');
    localStorage.removeItem('st_grefresh');
  }

  // ─── DRIVE API ───────────────────────────────────────────
  function apiCall(url, opts){
    var token = getToken();
    if(!token) return Promise.reject(new Error('Sin token'));
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, opts).then(function(r){
      if(!r.ok) return r.json().then(function(e){ throw new Error(e.error?.message||r.status); });
      return r.status === 204 ? {} : r.json();
    });
  }

  // Buscar o crear carpeta en Drive
  function getOrCreateFolder(name, parentId){
    var q = "name='"+name+"' and mimeType='application/vnd.google-apps.folder' and trashed=false"
      + (parentId ? " and '"+parentId+"' in parents" : " and 'root' in parents");
    return apiCall('https://www.googleapis.com/drive/v3/files?q='+encodeURIComponent(q)+'&fields=files(id,name)')
      .then(function(res){
        if(res.files && res.files.length > 0) return res.files[0].id;
        return apiCall('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : []
          })
        }).then(function(f){ return f.id; });
      });
  }

  // Obtener carpeta: ScorpionTail/YYYY/MM/modulo
  function getModuleFolder(modulo){
    var now = new Date();
    var yyyy = String(now.getFullYear());
    var mm   = String(now.getMonth()+1).padStart(2,'0');
    return getOrCreateFolder(FOLDER_NAME)
      .then(function(root){ return getOrCreateFolder(yyyy, root); })
      .then(function(year){ return getOrCreateFolder(mm, year); })
      .then(function(month){ return getOrCreateFolder(modulo, month); });
  }

  // Subir o actualizar archivo JSON
  function uploadJSON(filename, data, modulo){
    return getModuleFolder(modulo).then(function(folderId){
      var content = JSON.stringify(data, null, 2);
      var blob = new Blob([content], {type:'application/json'});

      // Buscar si ya existe
      var q = "name='"+filename+"' and '"+folderId+"' in parents and trashed=false";
      return apiCall('https://www.googleapis.com/drive/v3/files?q='+encodeURIComponent(q)+'&fields=files(id)')
        .then(function(res){
          var form = new FormData();
          var meta = {name: filename, mimeType: 'application/json'};
          if(!res.files || res.files.length === 0){
            // Crear nuevo
            meta.parents = [folderId];
            form.append('metadata', new Blob([JSON.stringify(meta)],{type:'application/json'}));
            form.append('file', blob);
            return apiCall('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
              method: 'POST', body: form
            });
          } else {
            // Actualizar existente
            var fileId = res.files[0].id;
            return apiCall('https://www.googleapis.com/upload/drive/v3/files/'+fileId+'?uploadType=multipart', {
              method: 'PATCH', body: (function(){
                var f=new FormData();
                f.append('metadata',new Blob([JSON.stringify({name:filename})],{type:'application/json'}));
                f.append('file',blob);
                return f;
              })()
            });
          }
        });
    });
  }

  // ─── INDICADOR VISUAL (SYNC-004) ─────────────────────────
  function mostrarIndicador(estado){
    var el = document.getElementById('st-sync-indicator');
    if(!el){
      el = document.createElement('div');
      el.id = 'st-sync-indicator';
      el.style.cssText = 'position:fixed;bottom:60px;right:14px;background:#0a1628;color:#C8A951;' +
        'font-size:11px;font-weight:700;padding:5px 10px;border-radius:20px;' +
        'display:flex;align-items:center;gap:5px;z-index:9998;' +
        'box-shadow:0 2px 8px rgba(0,0,0,.3);transition:opacity .3s;font-family:Arial,sans-serif';
      document.body.appendChild(el);
    }
    var iconos = {
      syncing: '<span style="display:inline-block;animation:st-spin .8s linear infinite">🔄</span>',
      ok:      '✅',
      error:   '❌'
    };
    var textos = {
      syncing: 'Sincronizando...',
      ok:      'Drive sincronizado',
      error:   'Error sync Drive'
    };
    // Agregar keyframes si no existen
    if(!document.getElementById('st-sync-style')){
      var s=document.createElement('style');
      s.id='st-sync-style';
      s.textContent='@keyframes st-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(s);
    }
    el.innerHTML = iconos[estado] + ' ' + textos[estado];
    el.style.opacity = '1';
    if(estado !== 'syncing'){
      setTimeout(function(){ el.style.opacity='0'; }, 3000);
    }
  }

  // ─── API PÚBLICA ─────────────────────────────────────────
  /**
   * Guardar registro en Drive automáticamente
   * @param {string} modulo  — nombre del módulo (ej: 'solicitud', 'poseidon', 'vale', 'nls')
   * @param {string} id      — identificador del registro (ej: 'ADQ-2026-0001')
   * @param {object} data    — objeto con los datos a respaldar
   */
  function guardar(modulo, id, data){
    if(!isConnected()) return Promise.resolve({skip:true});
    mostrarIndicador('syncing');
    var filename = id.replace(/[^a-zA-Z0-9\-_]/g,'_') + '.json';
    return uploadJSON(filename, data, modulo)
      .then(function(res){
        mostrarIndicador('ok');
        return res;
      })
      .catch(function(e){
        mostrarIndicador('error');
        console.warn('[STDrive] error al guardar:', e.message);
        throw e;
      });
  }

  return {
    isConnected:      isConnected,
    login:            login,
    logout:           logout,
    guardar:          guardar,
    mostrarIndicador: mostrarIndicador
  };

})();
