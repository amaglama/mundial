/* ============================================================
   CONFIGURACIÓN
   ============================================================ */
const CONFIG = {
  MATCHES_SHEET_ID: "1wfs1aDJSIO3jvpusA6n6kQMhBSgqJsxXlouezpvznkE",
  MATCHES_GID: "0",
  WEBAPP_URL: "https://script.google.com/macros/s/AKfycbyfAjtHSwzuxeDQxgQ5g8DaGFloFdrOHjYAaxVQe7EFt6_s8oGXCJ455YN1Kob9vHLC/exec"   // <- pega aquí la URL de tu Apps Script Web App una vez la tengas, para que cargue sola
};

let matches = [];      // [{id, local, gl, gv, pl, pv, visitante, origGl, origGv, origPl, origPv}]
let saving = false;

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function setSync(state, msg){
  const dot = document.getElementById("syncDot");
  const text = document.getElementById("syncText");
  dot.className = "sync-dot" + (state==="live"?" live":state==="error"?" error":"");
  text.textContent = msg;
}

function showToast(msg, ok){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + (ok ? "ok":"bad");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>t.classList.remove("show"), 5500);
}

/* ---------- lectura vía JSONP (sin problemas de CORS) ---------- */
let jsonpCounter = 0;
function loadViaJSONP(id, gid){
  return new Promise((resolve, reject) => {
    const cbName = "__matchCb" + (jsonpCounter++);
    const timeout = setTimeout(()=>{
      cleanup();
      reject(new Error("Tiempo de espera agotado. Verifica que la hoja sea pública (Compartir → Cualquiera con el enlace → Lector)."));
    }, 9000);
    function cleanup(){
      clearTimeout(timeout);
      delete window[cbName];
      if(script.parentNode) script.parentNode.removeChild(script);
    }
    window[cbName] = (resp) => {
      cleanup();
      try{
        if(resp.status === "error"){
          const m = (resp.errors && resp.errors[0] && resp.errors[0].detailed_message) || "la hoja no está disponible públicamente";
          reject(new Error(m));
          return;
        }
        const cols = resp.table.cols.map(c => (c.label || c.id || "").trim().toLowerCase());
        const rows = resp.table.rows.map(r => r.c.map(cell => cell ? String(cell.f !== undefined && cell.f !== null ? cell.f : (cell.v!==null && cell.v!==undefined ? cell.v : "")) : ""));
        resolve([cols, ...rows]);
      }catch(e){ reject(e); }
    };
    const script = document.createElement("script");
    const gidPart = gid ? `&gid=${gid}` : "";
    script.src = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json;responseHandler:${cbName}&headers=1${gidPart}&_=${Date.now()}`;
    script.onerror = () => { cleanup(); reject(new Error("No se pudo cargar la hoja. Revisa que sea pública.")); };
    document.body.appendChild(script);
  });
}

/* ---------- carga de partidos ---------- */
async function loadMatches(){
  setSync("idle","Sincronizando…");
  try{
    const rows = await loadViaJSONP(CONFIG.MATCHES_SHEET_ID, CONFIG.MATCHES_GID);
    const header = rows[0];
    const find = (...names) => { for(const n of names){ const i = header.indexOf(n); if(i>-1) return i; } return -1; };
    const idx = { id: find("id"), local: find("equipo1"), gl: find("goles1"), pl: find("penales1"), gv: find("goles2"), visitante: find("equipo2"), pv: find("penales2") };
    if(idx.id===-1 || idx.local===-1 || idx.visitante===-1) throw new Error("No se encontraron las columnas ID, EQUIPO1 y EQUIPO2 en la primera fila.");

    const dataRows = rows.slice(1).filter(r => r.some(c=>String(c).trim()!==""));
    matches = dataRows.map(r => {
      const gl = idx.gl>-1 ? (r[idx.gl] ?? "") : "";
      const gv = idx.gv>-1 ? (r[idx.gv] ?? "") : "";
      const pl = idx.pl>-1 ? (r[idx.pl] ?? "") : "";
      const pv = idx.pv>-1 ? (r[idx.pv] ?? "") : "";
      return {
        id: r[idx.id], local: r[idx.local], visitante: r[idx.visitante],
        gl: String(gl), gv: String(gv),
        pl: String(pl), pv: String(pv),
        origGl: String(gl), origGv: String(gv),
        origPl: String(pl), origPv: String(pv)
      };
    });
    renderMatches();
    setSync("live", "Sincronizado · " + new Date().toLocaleTimeString());
  }catch(err){
    setSync("error", "Error al sincronizar");
    showToast("No se pudo leer la hoja: " + err.message, false);
    document.getElementById("matchList").innerHTML = '<div class="empty-msg">No se pudieron cargar los partidos.</div>';
  }
}

function isDirty(m){ return m.gl !== m.origGl || m.gv !== m.origGv || m.pl !== m.origPl || m.pv !== m.origPv; }

function hayPenales(m){ return m.gl == m.gv; }

function renderMatches(){
  const list = document.getElementById("matchList");
  if(!matches.length){
    list.innerHTML = '<div class="empty-msg">No hay partidos en esta hoja.</div>';
    updateToolbar();
    return;
  }
  list.innerHTML = matches.map((m,i)=>`
    <div class="match" data-i="${i}">
        <div class="reglamentario">
            <div class="num">${escapeHtml(m.id)}</div>
            <div class="team local">${escapeHtml(m.local)}</div>
            <input class="score gl" type="number" min="0" max="20" inputmode="numeric" value="${escapeHtml(m.gl)}" aria-label="Goles ${escapeHtml(m.local)}">
            <div class="vs">–</div>
            <input class="score gv" type="number" min="0" max="20" inputmode="numeric" value="${escapeHtml(m.gv)}" aria-label="Goles ${escapeHtml(m.visitante)}">
            <div class="team visit">${escapeHtml(m.visitante)}</div>
            <div class="row-status" data-status></div>
        </div>
        <div class="penales nones">
            <div></div>
            <div class="penales-label">Penales</div>
            <input class="score pl" type="number" min="0" max="20" inputmode="numeric" value="${escapeHtml(m.pl)}" aria-label="Penales ${escapeHtml(m.local)}">
            <div class="vs">–</div>
            <input class="score pv" type="number" min="0" max="20" inputmode="numeric" value="${escapeHtml(m.pv)}" aria-label="Penales ${escapeHtml(m.visitante)}">
        </div>
    </div>
  `).join("");

  list.querySelectorAll(".match").forEach(el=>{
    const i = Number(el.dataset.i);
    el.querySelector(".gl").addEventListener("input", e=>{ matches[i].gl = e.target.value; refreshRow(i); });
    el.querySelector(".pl").addEventListener("input", e=>{ matches[i].pl = e.target.value; refreshRow(i); });
    el.querySelector(".gv").addEventListener("input", e=>{ matches[i].gv = e.target.value; refreshRow(i); });
    el.querySelector(".pv").addEventListener("input", e=>{ matches[i].pv = e.target.value; refreshRow(i); });
  });
  matches.forEach((m,i)=>refreshRow(i));
}

function defPenales(i, partido){
    if(!partido) return;
    
    let penales = partido.querySelector(".penales");
    if(!penales) return;
    if(hayPenales(matches[i])) penales.classList.remove("nones");
    else{
      penales.querySelectorAll("input").forEach(input => {
        input.value = "";
        input.setAttribute("arial-label", "");
      });
      penales.classList.add("nones");
    }    
}

function refreshRow(i){
  const el = document.querySelector(`.match[data-i="${i}"]`);
  if(!el) return;
  const m = matches[i];
  el.classList.remove("dirty","saved","error");
  const statusEl = el.querySelector("[data-status]");
  if(isDirty(m)){
    el.classList.add("dirty");
    statusEl.textContent = "sin guardar";
  } else {
    statusEl.textContent = "";
  }
  defPenales(i, el);
  updateToolbar();
}

function updateToolbar(){
  const dirty = matches.filter(isDirty);
  document.getElementById("dirtyCount").textContent = dirty.length ? `${dirty.length} partido(s) sin guardar` : "";
  document.getElementById("saveAllBtn").disabled = dirty.length === 0 || saving;
}

/* ---------- guardado (Apps Script Web App, sin CORS) ---------- */
function postNoCors(url, payload){
  return fetch(url, {
    method: "POST",
    mode: "no-cors",          // evita el bloqueo CORS; no podremos leer la respuesta
    body: JSON.stringify(payload)
  });
}

async function saveAll(){
  if(!CONFIG.WEBAPP_URL){
    showToast("Primero pega la URL de tu Apps Script Web App arriba.", false);
    return;
  }
  const dirty = matches.filter(isDirty);
  
  if(!dirty.length) return;

  saving = true;
  document.getElementById("saveAllBtn").disabled = true;
  document.getElementById("saveAllBtn").textContent = "Guardando…";

  const payload = { updates: dirty.map(m => ({ id: m.id, gl: m.gl, gv: m.gv, pl:m.pl, pv:m.pv })) };

  try{
    await postNoCors(CONFIG.WEBAPP_URL, payload);
    // no-cors no permite leer la respuesta: confirmamos releyendo la hoja
    await new Promise(r=>setTimeout(r, 1500));
    const before = JSON.stringify(matches.map(m=>({id:m.id,gl:m.gl,gv:m.gv})));
    await loadMatches();
    showToast("Cambios enviados y hoja sincronizada.", true);
  }catch(err){
    showToast("No se pudo enviar: " + err.message, false);
  }finally{
    saving = false;
    document.getElementById("saveAllBtn").textContent = "Guardar cambios";
    updateToolbar();
  }
}

/* ---------- eventos ---------- */
document.getElementById("refreshBtn").addEventListener("click", loadMatches);
document.getElementById("saveAllBtn").addEventListener("click", saveAll);
document.getElementById("saveUrlBtn").addEventListener("click", ()=>{
  CONFIG.WEBAPP_URL = document.getElementById("webAppUrl").value.trim();
  showToast(CONFIG.WEBAPP_URL ? "URL guardada para esta sesión." : "URL borrada.", true);
});

if(CONFIG.WEBAPP_URL){ document.getElementById("webAppUrl").value = CONFIG.WEBAPP_URL; }
loadMatches();