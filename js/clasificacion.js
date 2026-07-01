/* ============================================================
   CONFIGURACIÓN
   Pega aquí el enlace de tu Google Sheet para que cargue
   automáticamente al abrir la página (en vez de tener que
   pegarlo cada vez en el recuadro de arriba).
   Acepta dos formatos:
   - Enlace normal para compartir (recomendado, sin CORS):
     https://docs.google.com/spreadsheets/d/TU_ID/edit#gid=0
   - Enlace "Publicar en la web" en formato CSV:
     https://docs.google.com/spreadsheets/d/e/XXXXXXX/pub?output=csv
   ============================================================ */
const CONFIG = {
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/1wfs1aDJSIO3jvpusA6n6kQMhBSgqJsxXlouezpvznkE/edit?usp=sharing",
  AUTO_REFRESH_MS: 30000,         // refresca solo cada 30 segundos. Pon 0 para desactivar.
  TERCEROS_SHEET_ID: "1wfs1aDJSIO3jvpusA6n6kQMhBSgqJsxXlouezpvznkE",
  TERCEROS_GID: "193567831"
};

/* ---------- estructura fija del cuadro (coincide con la imagen) ---------- */
// lado izquierdo, 16avos (de arriba hacia abajo)
const L32 = [
  ["L32-1","Alemania","de","Paraguay","py"],
  ["L32-2","Francia","fr","Suecia","se"],
  ["L32-3","Sudáfrica","za","Canadá","ca"],
  ["L32-4","Países Bajos","nl","Marruecos","ma"],
  ["L32-5","2K","","2L",""],
  ["L32-6","España","es","2J",""],
  ["L32-7","Estados Unidos","us","Bosnia y Herzegovina","ba"],
  ["L32-8","Bélgica","be","3AEIHJ",""]
];
// lado derecho, 16avos (de arriba hacia abajo)
const R32 = [
  ["R32-1","Brasil","br","Japón","jp"],
  ["R32-2","Costa de Marfil","ci","Noruega","no"],
  ["R32-3","México","mx","3CEFHI",""],
  ["R32-4","1L","","3EIHJK",""],
  ["R32-5","Argentina","ar","Cabo Verde","cv"],
  ["R32-6","Australia","au","Egipto","eg"],
  ["R32-7","Suiza","ch","3EFGIJ",""],
  ["R32-8","1K","","3DEIJL",""]
];

function emptyRows(prefix, n){
  const r=[];
  for(let i=1;i<=n;i++) r.push([prefix+"-"+i, "", "", "", ""]);
  return r;
}

const L16 = emptyRows("L16",4);
const R16 = emptyRows("R16",4);
const L8  = emptyRows("L8",2);
const R8  = emptyRows("R8",2);
const SFL = [["SF-L","","","",""]];
const SFR = [["SF-R","","","",""]];
const FIN = [["F-1","","","",""]];

const ALL_DEFAULT_ROWS = [...L32,...R32,...L16,...R16,...L8,...R8,...SFL,...SFR,...FIN];

// id -> {equipo1,codigo1,goles1,equipo2,codigo2,goles2}
function rowsToMap(rows){
  const m = {};
  rows.forEach(([id,e1,c1,e2,c2,g1,g2,p1,p2])=>{
    m[id] = {equipo1:e1||"", codigo1:c1||"", goles1: g1!==undefined?g1:"", penales1: p1!==undefined?p1:"", equipo2:e2||"", codigo2:c2||"", goles2: g2!==undefined?g2:"", penales2: p2!==undefined?p2:""};
  });
  return m;
}
// nota: las filas arriba tienen 5 campos (sin goles); normalizamos:
function normalizeDefault(rows){
  return rows.map(r=>{
    const [id,e1,c1,e2,c2] = r;
    return [id,e1,c1,e2,c2,"",""];
  });
}
let dataMap = rowsToMap(normalizeDefault(ALL_DEFAULT_ROWS));

/* pares que alimentan a la siguiente ronda, para dibujar conectores */
const LINKS = [
  ["L32-1","L32-2","L16-1"], ["L32-3","L32-4","L16-2"], ["L32-5","L32-6","L16-3"], ["L32-7","L32-8","L16-4"],
  ["R32-1","R32-2","R16-1"], ["R32-3","R32-4","R16-2"], ["R32-5","R32-6","R16-3"], ["R32-7","R32-8","R16-4"],
  ["L16-1","L16-2","L8-1"], ["L16-3","L16-4","L8-2"],
  ["R16-1","R16-2","R8-1"], ["R16-3","R16-4","R8-2"],
  ["L8-1","L8-2","SF-L"],
  ["R8-1","R8-2","SF-R"]
];
const FINAL_LINKS = [["SF-L","F-1"], ["SF-R","F-1"]];

const ROUNDS_LEFT  = [{key:"L32",n:8,label:"16avos"},{key:"L16",n:4,label:"Octavos"},{key:"L8",n:2,label:"Cuartos"},{key:"SF-L",n:1,label:"Semifinal"}];
const ROUNDS_RIGHT = [{key:"R32",n:8,label:"16avos"},{key:"R16",n:4,label:"Octavos"},{key:"R8",n:2,label:"Cuartos"},{key:"SF-R",n:1,label:"Semifinal"}];

function idsFor(roundDef){
  if(roundDef.n===1) return [roundDef.key];
  const ids=[];
  for(let i=1;i<=roundDef.n;i++) ids.push(roundDef.key+"-"+i);
  return ids;
}

function flagOrPlaceholder(name, code){
  if(!name) return '<span class="ph"></span>';
  if(code) return `<img class="flag" src="https://flagcdn.com/h40/${code}.png" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`;
  return '<span class="ph"></span>';
}

function isPlaceholderCode(name){
  // códigos de cruces todavía no definidos, ej "2K", "3AEIHJ", "1L"
  return /^[0-9][A-Z]+$/.test(name||"");
}

function isWinner(name, golesF, golesC, penalesF, penalesC){
  const hasName = !!name;
  if(hasName && penalesF!=="" && penalesC!=="" && Number(penalesF) > Number(penalesC)) return true;
  return hasName && golesF!=="" && golesC!=="" && Number(golesF) > Number(golesC);
}
function slotHTML(name, code, goles, otherGoles, penales, otrosPenales){
  const hasName = !!name;
  const cls = ["slot"];
  if(!hasName) cls.push("empty");
  if(isPlaceholderCode(name)) cls.push("placeholder-code");
  if( isWinner(name, goles, otherGoles, penales, otrosPenales) ) cls.push("winner");
  const flag = flagOrPlaceholder(name, code);
  const label = hasName ? name : "Por definir";
  const score = (goles!=="" && goles!==undefined ? goles : "-") + (penales!=="" && penales!==undefined && Number(penales)>0? `(${penales})` : "");
  
  return `<div class="${cls.join(' ')}" title="${escapeHtml(label)}">${flag}<span class="name">${escapeHtml(label)}</span><span class="score">${escapeHtml(String(score))}</span></div>`;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function matchHTML(id){
  const d = dataMap[id] || {};
  return `<div class="match" data-id="${id}">
    ${slotHTML(d.equipo1, d.codigo1, d.goles1, d.goles2, d.penales1, d.penales2)}
    ${slotHTML(d.equipo2, d.codigo2, d.goles2, d.goles1, d.penales2, d.penales1)}
  </div>`;
}

function roundHTML(roundDef){

  const ids = idsFor(roundDef);
  
  const matches = ids.map(matchHTML).join("");
  return `<div class="round" data-n="${roundDef.n}" data-key="${roundDef.key}">
    <div class="round-label">${roundDef.label}</div>
    ${matches}
  </div>`;
}

function renderBracket(){
  const left = ROUNDS_LEFT.map(roundHTML).join("");
  const right = ROUNDS_RIGHT.map(roundHTML).join("");

  const final = dataMap["F-1"] || {};
  const finalHTML = `
    <div class="final-col">
      <div class="round-label">Final</div>
      <div class="final-trophy">
        <div class="net-bg"></div>
        <div class="ft-label">FINAL</div>
        <div class="ft-year">2026</div>
      </div>
      <div class="match final-match" data-id="F-1">
        ${slotHTML(final.equipo1, final.codigo1, final.goles1, final.goles2, final.penales1, final.penales2)}
        ${slotHTML(final.equipo2, final.codigo2, final.goles2, final.goles1, final.penales2, final.penales1)}
      </div>
    </div>`;

  document.getElementById("bracket").innerHTML = `
    <div class="side left">${left}</div>
    ${finalHTML}
    <div class="side right">${right}</div>
    <svg class="connectors" id="connSvg"></svg>
  `;

  // dibujar conectores después de que el layout exista en el DOM
  requestAnimationFrame(drawConnectors);
}

function centerOf(el, bracketRect){
  const r = el.getBoundingClientRect();
  return {
    left: r.left - bracketRect.left,
    right: r.right - bracketRect.left,
    top: r.top - bracketRect.top,
    bottom: r.bottom - bracketRect.top,
    cy: (r.top + r.bottom)/2 - bracketRect.top
  };
}

function drawConnectors(){
  const bracketEl = document.getElementById("bracket");
  const svg = document.getElementById("connSvg");
  const bracketRect = bracketEl.getBoundingClientRect();
  svg.setAttribute("width", bracketRect.width);
  svg.setAttribute("height", bracketRect.height);
  svg.setAttribute("viewBox", `0 0 ${bracketRect.width} ${bracketRect.height}`);

  let paths = "";

  function elFor(id){ return bracketEl.querySelector(`.match[data-id="${id}"]`); }

  LINKS.concat(FINAL_LINKS.length?[]:[]).forEach(()=>{}); // no-op, keep structure simple

  LINKS.forEach(([aId,bId,pId])=>{
    const a = elFor(aId), b = elFor(bId), p = elFor(pId);
    if(!a||!b||!p) return;
    const side = aId.startsWith("R") ? "right" : "left";
    const ca = centerOf(a, bracketRect);
    const cb = centerOf(b, bracketRect);
    const cp = centerOf(p, bracketRect);
    const xChild = side==="left" ? ca.right : ca.left;
    const xParent = side==="left" ? cp.left : cp.right;
    const xMid = (xChild + xParent)/2;
    paths += `<path d="M ${xChild} ${ca.cy} H ${xMid} M ${(side==='left'?cb.right:cb.left)} ${cb.cy} H ${xMid} M ${xMid} ${ca.cy} V ${cb.cy} M ${xMid} ${(ca.cy+cb.cy)/2} H ${xParent}" />`;
  });

  FINAL_LINKS.forEach(([aId,pId])=>{
    const a = elFor(aId), p = elFor(pId);
    if(!a||!p) return;
    const side = aId.endsWith("L") ? "left" : "right";
    const ca = centerOf(a, bracketRect);
    const cp = centerOf(p, bracketRect);
    const xChild = side==="left" ? ca.right : ca.left;
    const xParent = side==="left" ? cp.left : cp.right;
    const xMid = (xChild + xParent)/2;
    paths += `<path d="M ${xChild} ${ca.cy} H ${xMid} V ${cp.cy} H ${xParent}" />`;
  });

  svg.innerHTML = `<g fill="none" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--line-faint')}" stroke-width="1.5">${paths}</g>`;
}

/* ---------- carga desde Google Sheets ---------- */

function parseCSV(text){
  // parser simple que respeta comillas (Google Sheets exporta con comillas si hay comas)
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for(let i=0;i<text.length;i++){
    const c = text[i];
    if(inQuotes){
      if(c === '"'){
        if(text[i+1] === '"'){ field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if(c === '"') inQuotes = true;
      else if(c === ','){ row.push(field); field=""; }
      else if(c === '\n' || c === '\r'){
        if(c === '\r' && text[i+1] === '\n') i++;
        row.push(field); field="";
        if(row.length>1 || row[0]!=="") rows.push(row);
        row = [];
      } else field += c;
    }
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }
  return rows;
}

function applySheetRows(rows){
  if(!rows.length) return false;
  
  const header = rows[0].map(h=>h.trim().toLowerCase());
  const idx = {
    id: header.indexOf("id"),
    equipo1: header.indexOf("equipo1"),
    codigo1: header.indexOf("codigo1"),
    goles1: header.indexOf("goles1"),
    penales1: header.indexOf("penales1"),
    equipo2: header.indexOf("equipo2"),
    codigo2: header.indexOf("codigo2"),
    goles2: header.indexOf("goles2"),
    penales2: header.indexOf("penales2"),
  };
  if(idx.id === -1) return false;

  const newMap = rowsToMap(normalizeDefault(ALL_DEFAULT_ROWS)); // base, por si la hoja viene incompleta
  for(let i=1;i<rows.length;i++){
    const r = rows[i];
    const id = (r[idx.id]||"").trim();
    if(!id) continue;
    newMap[id] = {
      equipo1: (idx.equipo1>-1 ? r[idx.equipo1] : "")||"",
      codigo1: (idx.codigo1>-1 ? r[idx.codigo1] : "")||"",
      goles1: (idx.goles1>-1 ? r[idx.goles1] : "")||"",
      penales1: (idx.penales1>-1 ? r[idx.penales1] : "")||"",
      equipo2: (idx.equipo2>-1 ? r[idx.equipo2] : "")||"",
      codigo2: (idx.codigo2>-1 ? r[idx.codigo2] : "")||"",
      goles2: (idx.goles2>-1 ? r[idx.goles2] : "")||"",
      penales2: (idx.penales2>-1 ? r[idx.penales2] : "")||"",
    };
  }
  dataMap = newMap;
  return true;
}

function setSync(state, msg){
  const dot = document.getElementById("syncDot");
  const text = document.getElementById("syncText");
  dot.className = "sync-dot" + (state==="live"?" live":state==="error"?" error":"");
  text.textContent = msg;
}

function showToast(msg){
  const t = document.getElementById("toast");
  t.innerHTML = msg;
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>t.classList.remove("show"), 9000);
}

/* ---------- detectar tipo de enlace pegado ---------- */
function parseSheetInput(input){
  input = input.trim();
  if(!input) return null;

  // enlace "Publicar en la web" (.../d/e/2PACX-.../pub?...output=csv...)
  if(/\/d\/e\/2PACX/.test(input)){
    return { mode:"pub", csvUrl: input };
  }
  // enlace normal de la hoja: .../spreadsheets/d/{ID}/edit#gid={GID}  (o solo el ID pegado)
  let id = null, gid = null;
  const idMatch = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if(idMatch) id = idMatch[1];
  else if(/^[a-zA-Z0-9-_]{20,}$/.test(input)) id = input; // pegaron solo el ID

  const gidMatch = input.match(/gid=([0-9]+)/);
  if(gidMatch) gid = gidMatch[1];

  if(id) return { mode:"sheet", id, gid };
  return { mode:"pub", csvUrl: input }; // como último recurso, tratar de descargarlo tal cual
}

/* ---------- método robusto: JSONP contra la API de Visualización (sin problemas de CORS) ---------- */
let jsonpCounter = 0;
function loadViaJSONP(id, gid){
  return new Promise((resolve, reject) => {
    const cbName = "__sheetCb" + (jsonpCounter++);
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
          const msg = (resp.errors && resp.errors[0] && resp.errors[0].detailed_message) || "la hoja no está disponible públicamente";
          reject(new Error(msg));
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
    script.onerror = () => { cleanup(); reject(new Error("No se pudo cargar la hoja. Revisa el enlace y que sea pública.")); };
    document.body.appendChild(script);
  });
}

async function loadFromSheet(rawInput){
  if(!rawInput){
    setSync("idle","Mostrando datos de ejemplo");
    renderBracket();
    return;
  }
  const parsed = parseSheetInput(rawInput);
  setSync("idle","Sincronizando…");
  try{
    let rows;
    if(parsed.mode === "sheet"){
      rows = await loadViaJSONP(parsed.id, parsed.gid);
    } else {
      let res;
      try{
        res = await fetch(parsed.csvUrl, {cache:"no-store"});
      }catch(networkErr){
        throw new Error("Bloqueo de red/CORS al pedir el CSV directamente. Pega mejor el enlace normal para compartir la hoja (Compartir → Cualquiera con el enlace) en vez del enlace de 'Publicar en la web'.");
      }
      if(!res.ok) throw new Error("HTTP " + res.status + " — revisa que el enlace sea correcto y la hoja esté publicada.");
      const text = await res.text();
      rows = parseCSV(text).filter(r=>r.some(c=>c.trim()!==""));
    }
    const ok = applySheetRows(rows);
    if(!ok) throw new Error("No se encontró la columna 'id' en la primera fila de la hoja.");
    renderBracket();
    const now = new Date();
    setSync("live", "Sincronizado · " + now.toLocaleTimeString());
  }catch(err){
    setSync("error", "Error al sincronizar");
    showToast("No se pudo leer la hoja: " + err.message);
    renderBracket();
  }
}

/* ---------- panel de "mejores terceros" ---------- */
let tercerosLoaded = false;
let tercerosLoading = false;

function renderTercerosTable(rows){
  const body = document.getElementById("tercerosBody");
  if(!rows.length || rows.length < 2){
    body.innerHTML = '<div class="terceros-msg">La pestaña de terceros está vacía.</div>';
    return;
  }
  const header = rows[0].map(h=>h.trim());
  const dataRows = rows.slice(1).filter(r => r.some(c=>String(c).trim()!==""));

  // detectar de forma flexible qué columna es cuál, sin importar el orden
  const lower = header.map(h=>h.toLowerCase());
  const find = (...names) => { for(const n of names){ const i = lower.indexOf(n); if(i>-1) return i; } return -1; };
  const idx = {
    grupo: find("grupo","group"),
    equipo: find("nombre","equipo","team"),
    pj: find("pj"), pg: find("pg"), pe: find("pe"), pp: find("pp"),
    gf: find("gf"), gc: find("gc"), gd: find("gd"), pts: find("pts","puntos")
  };

  const labels = {grupo:"Grupo", equipo:"Equipo", pj:"PJ", pg:"PG", pe:"PE", pp:"PP", gf:"GF", gc:"GC", gd:"GD", pts:"Pts"};
  const cols = Object.keys(idx).filter(k => idx[k] > -1);

  let thead = '<th>#</th>' + cols.map(k=>`<th>${labels[k]}</th>`).join("");
  let tbody = dataRows.map((r,i)=>{
    const rank = i+1;
    const cls = rank<=8 ? "clasifica" : "";
    const cells = cols.map(k=>{
      const val = escapeHtml(r[idx[k]] || "");
      if(k==="equipo") return `<td class="team">${val}</td>`;
      return `<td>${val}</td>`;
    }).join("");
    return `<tr class="${cls}"><td class="rank">${rank}</td>${cells}</tr>`;
  }).join("");

  document.getElementById("tercerosSub").textContent =
    dataRows.length + " equipos · los primeros 8 avanzan a 16avos";
  body.innerHTML = `<div class="terceros-table-wrap"><table class="terceros-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
}

async function loadTerceros(force){
  if(tercerosLoading) return;
  if(tercerosLoaded && !force) return;
  tercerosLoading = true;
  const body = document.getElementById("tercerosBody");
  body.innerHTML = '<div class="terceros-msg">Cargando…</div>';
  try{
    const rows = await loadViaJSONP(CONFIG.TERCEROS_SHEET_ID, CONFIG.TERCEROS_GID);
    renderTercerosTable(rows);
    tercerosLoaded = true;
  }catch(err){
    body.innerHTML = `<div class="terceros-msg" style="color:#e8b6ae">No se pudo cargar: ${escapeHtml(err.message)}</div>`;
  }finally{
    tercerosLoading = false;
  }
}

document.getElementById("tercerosBtn").addEventListener("click", ()=>{
  const panel = document.getElementById("tercerosPanel");
  const btn = document.getElementById("tercerosBtn");
  const open = panel.hidden;
  panel.hidden = !open;
  btn.setAttribute("aria-expanded", String(open));
  if(open) loadTerceros(false);
});

/* ---------- eventos ---------- */
document.getElementById("connectBtn").addEventListener("click", ()=>{
  const url = document.getElementById("sheetUrl").value.trim();
  CONFIG.SHEET_CSV_URL = url;
  loadFromSheet(url);
});
document.getElementById("refreshBtn").addEventListener("click", ()=>{
  loadFromSheet(CONFIG.SHEET_CSV_URL || document.getElementById("sheetUrl").value.trim());
});
window.addEventListener("resize", ()=>{ requestAnimationFrame(drawConnectors); });

/* ---------- inicio ---------- */
if(CONFIG.SHEET_CSV_URL){
  document.getElementById("sheetUrl").value = CONFIG.SHEET_CSV_URL;
}
loadFromSheet(CONFIG.SHEET_CSV_URL);

if(CONFIG.AUTO_REFRESH_MS > 0){
  setInterval(()=>loadFromSheet(CONFIG.SHEET_CSV_URL), CONFIG.AUTO_REFRESH_MS);
}
