/* ============================================================
   FLAG HELPER  – códigos ISO de los países del Mundial 2026
   ============================================================ */
const FLAG = {
  "México": "mx", "Sudáfrica": "za", "Corea del Sur": "kr", "Chequia": "cz",
  "Suiza": "ch", "Canadá": "ca", "Bosnia y Herz.": "ba", "Catar": "qa",
  "Estados Unidos": "us", "Uruguay": "uy", "Senegal": "sn", "Gales": "gb-wls",
  "Francia": "fr", "Australia": "au", "Dinamarca": "dk", "Túnez": "tn",
  "España": "es", "Ecuador": "ec", "Jamaica": "jm", "Grecia": "gr",
  "Brasil": "br", "Suecia": "se", "Nigeria": "ng", "Bélgica": "be",
  "Portugal": "pt", "Colombia": "co", "Croacia": "hr", "Ghana": "gh",
  "Inglaterra": "gb-eng", "Panamá": "pa", "Irlanda": "ie", "Albania": "al",
  "Alemania": "de", "Japón": "jp", "Irán": "ir", "Paraguay": "py",
  "Argentina": "ar", "Jordania": "jo", "Argelia": "dz", "Austria": "at",
  "Países Bajos": "nl", "Marruecos": "ma", "Uzbekistán": "uz", "RD Congo": "cd",
  "Italia": "it", "Noruega": "no", "Arabia Saud.": "sa", "Costa Rica": "cr"
};

function flagImg(name) {
  const code = FLAG[name];
  if (!code) return '<span class="flag"></span>';
  return `<img class="flag" src="https://flagcdn.com/h40/${code}.png" alt="${esc(name)}" loading="lazy" onerror="this.style.visibility='hidden'">`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function dgClass(n) {
  const v = Number(n);
  return v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu';
}
function dgLabel(n) {
  const v = Number(n);
  return v > 0 ? '+' + v : String(v);
}

/* ============================================================
   RENDER
   ============================================================ */
let _data = null;
let _activeGroup = 'all';

function renderGroups(data) {
  _data = data;
  const grid = document.getElementById('groupsGrid');

  // update header labels
  if (data.torneo)  document.getElementById('torneoLabel').textContent = data.torneo;
  if (data.fase)    document.getElementById('phaseLabel').textContent  = data.fase;

  // update criteria legend
  if (data.criterio_orden && data.criterio_orden.length) {
    const dots = document.querySelectorAll('.legend-bar .crit');
    data.criterio_orden.forEach((c, i) => { if (dots[i]) dots[i].textContent = 'Criterio: ' + c; });
  }

  const grupos = data.tablas || {};
  buildFilterButtons(Object.keys(grupos));
  paintGrid(grupos);
}

function paintGrid(grupos) {
  const grid = document.getElementById('groupsGrid');
  const keys = Object.keys(grupos).filter(k => _activeGroup === 'all' || k === _activeGroup);

  if (!keys.length) {
    grid.innerHTML = '<div class="state-msg"><strong>Sin datos.</strong> Carga un archivo JSON válido.</div>';
    return;
  }

  grid.innerHTML = keys.map(nombre => {
    const equipos = grupos[nombre] || [];
    const letra = nombre.replace('Grupo ', '');
    const completado = equipos.length && equipos.every(e => e.pj > 0);
    const header = `
      <div class="group-card-head">
        <span class="group-letter">Grupo ${esc(letra)}</span>
        <span class="group-pgames">${completado ? '3 / 3 jornadas' : 'en curso'}</span>
      </div>`;

    const tbody = equipos.map(e => `
      <tr>
        <td class="td-pos">${esc(e.pos)}</td>
        <td class="td-team">${flagImg(e.equipo)}${esc(e.equipo)}</td>
        <td class="td-pts">${esc(e.pts)}</td>
        <td class="td-dg ${dgClass(e.dg)}">${dgLabel(e.dg)}</td>
        <td class="td-num col-gf">${esc(e.gf)}</td>
        <td class="td-num col-gc">${esc(e.gc)}</td>
        <td class="td-num col-pg">${esc(e.pg)}</td>
        <td class="td-num col-pe">${esc(e.pe)}</td>
        <td class="td-num col-pp">${esc(e.pp)}</td>
        <td class="td-num col-pj">${esc(e.pj)}</td>
      </tr>`).join('');

    return `
      <div class="group-card" data-group="${esc(nombre)}">
        ${header}
        <table class="group-table" aria-label="${esc(nombre)}">
          <thead>
            <tr>
              <th class="th-rank">#</th>
              <th class="th-team">Equipo</th>
              <th title="Puntos">PTS</th>
              <th title="Diferencia de goles">DG</th>
              <th class="col-gf" title="Goles a favor">GF</th>
              <th class="col-gc" title="Goles en contra">GC</th>
              <th class="col-pg" title="Partidos ganados">PG</th>
              <th class="col-pe" title="Partidos empatados">PE</th>
              <th class="col-pp" title="Partidos perdidos">PP</th>
              <th class="col-pj" title="Partidos jugados">PJ</th>
            </tr>
          </thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>`;
  }).join('');
}

/* ============================================================
   FILTER BUTTONS
   ============================================================ */
function buildFilterButtons(groupNames) {
  const bar = document.getElementById('filterBar');
  bar.innerHTML = '<span class="label">Grupo:</span>';

  const all = document.createElement('button');
  all.className = 'gbtn' + (_activeGroup === 'all' ? ' active' : '');
  all.dataset.group = 'all';
  all.textContent = 'Todos';
  bar.appendChild(all);

  groupNames.forEach(name => {
    const btn = document.createElement('button');
    const letra = name.replace('Grupo ', '');
    btn.className = 'gbtn' + (_activeGroup === name ? ' active' : '');
    btn.dataset.group = name;
    btn.textContent = letra;
    bar.appendChild(btn);
  });

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.gbtn');
    if (!btn) return;
    _activeGroup = btn.dataset.group;
    bar.querySelectorAll('.gbtn').forEach(b => b.classList.toggle('active', b.dataset.group === _activeGroup));
    if (_data) paintGrid(_data.tablas || {});
  });
}

/* ============================================================
   JSON LOADER
   ============================================================ */
function loadJSON(json) {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if (!data.tablas) throw new Error('El JSON no tiene el campo "tablas".');
    renderGroups(data);
  } catch (err) {
    document.getElementById('groupsGrid').innerHTML =
      `<div class="state-msg"><strong>Error al leer el JSON:</strong> ${esc(err.message)}</div>`;
  }
}

document.getElementById('jsonFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => loadJSON(ev.target.result);
  reader.readAsText(file, 'UTF-8');
});

/* ============================================================
   INLINE DEFAULT DATA
   Cambia esto por tu JSON real, o usa el selector de archivo.
   ============================================================ */
const DEFAULT_JSON = {
  "torneo": "Copa Mundial de la FIFA 2026",
  "fase": "Fase de Grupos",
  "criterio_orden": ["Puntos", "Diferencia de Goles", "Goles a Favor"],
  "tablas": {
    "Grupo A": [
      {"pos":1,"equipo":"México","pj":3,"pg":3,"pe":0,"pp":0,"gf":6,"gc":0,"dg":6,"pts":9},
      {"pos":2,"equipo":"Sudáfrica","pj":3,"pg":2,"pe":0,"pp":1,"gf":3,"gc":3,"dg":0,"pts":6},
      {"pos":3,"equipo":"Corea del Sur","pj":3,"pg":1,"pe":0,"pp":2,"gf":2,"gc":3,"dg":-1,"pts":3},
      {"pos":4,"equipo":"Chequia","pj":3,"pg":0,"pe":0,"pp":3,"gf":2,"gc":7,"dg":-5,"pts":0}
    ],
    "Grupo B": [
      {"pos":1,"equipo":"Suiza","pj":3,"pg":2,"pe":1,"pp":0,"gf":5,"gc":3,"dg":2,"pts":7},
      {"pos":2,"equipo":"Canadá","pj":3,"pg":1,"pe":1,"pp":1,"gf":4,"gc":3,"dg":1,"pts":4},
      {"pos":3,"equipo":"Bosnia y Herz.","pj":3,"pg":1,"pe":1,"pp":1,"gf":5,"gc":4,"dg":1,"pts":4},
      {"pos":4,"equipo":"Catar","pj":3,"pg":0,"pe":1,"pp":2,"gf":3,"gc":7,"dg":-4,"pts":1}
    ],
    "Grupo C": [
      {"pos":1,"equipo":"Estados Unidos","pj":3,"pg":2,"pe":1,"pp":0,"gf":7,"gc":2,"dg":5,"pts":7},
      {"pos":2,"equipo":"Uruguay","pj":3,"pg":2,"pe":0,"pp":1,"gf":5,"gc":4,"dg":1,"pts":6},
      {"pos":3,"equipo":"Senegal","pj":3,"pg":1,"pe":0,"pp":2,"gf":4,"gc":6,"dg":-2,"pts":3},
      {"pos":4,"equipo":"Gales","pj":3,"pg":0,"pe":1,"pp":2,"gf":2,"gc":6,"dg":-4,"pts":1}
    ],
    "Grupo D": [
      {"pos":1,"equipo":"Francia","pj":3,"pg":3,"pe":0,"pp":0,"gf":8,"gc":2,"dg":6,"pts":9},
      {"pos":2,"equipo":"Australia","pj":3,"pg":1,"pe":1,"pp":1,"gf":4,"gc":5,"dg":-1,"pts":4},
      {"pos":3,"equipo":"Dinamarca","pj":3,"pg":1,"pe":1,"pp":1,"gf":3,"gc":4,"dg":-1,"pts":4},
      {"pos":4,"equipo":"Túnez","pj":3,"pg":0,"pe":0,"pp":3,"gf":1,"gc":5,"dg":-4,"pts":0}
    ],
    "Grupo E": [
      {"pos":1,"equipo":"España","pj":3,"pg":3,"pe":0,"pp":0,"gf":9,"gc":2,"dg":7,"pts":9},
      {"pos":2,"equipo":"Ecuador","pj":3,"pg":1,"pe":1,"pp":1,"gf":4,"gc":5,"dg":-1,"pts":4},
      {"pos":3,"equipo":"Jamaica","pj":3,"pg":1,"pe":0,"pp":2,"gf":3,"gc":6,"dg":-3,"pts":3},
      {"pos":4,"equipo":"Grecia","pj":3,"pg":0,"pe":1,"pp":2,"gf":2,"gc":5,"dg":-3,"pts":1}
    ],
    "Grupo F": [
      {"pos":1,"equipo":"Brasil","pj":3,"pg":2,"pe":1,"pp":0,"gf":6,"gc":2,"dg":4,"pts":7},
      {"pos":2,"equipo":"Suecia","pj":3,"pg":1,"pe":1,"pp":1,"gf":4,"gc":4,"dg":0,"pts":4},
      {"pos":3,"equipo":"Nigeria","pj":3,"pg":1,"pe":0,"pp":2,"gf":3,"gc":5,"dg":-2,"pts":3},
      {"pos":4,"equipo":"Bélgica","pj":3,"pg":0,"pe":1,"pp":2,"gf":2,"gc":4,"dg":-2,"pts":1}
    ],
    "Grupo G": [
      {"pos":1,"equipo":"Portugal","pj":3,"pg":2,"pe":1,"pp":0,"gf":6,"gc":2,"dg":4,"pts":7},
      {"pos":2,"equipo":"Colombia","pj":3,"pg":2,"pe":0,"pp":1,"gf":5,"gc":3,"dg":2,"pts":6},
      {"pos":3,"equipo":"Croacia","pj":3,"pg":0,"pe":1,"pp":2,"gf":2,"gc":5,"dg":-3,"pts":1},
      {"pos":4,"equipo":"Ghana","pj":3,"pg":0,"pe":0,"pp":3,"gf":1,"gc":4,"dg":-3,"pts":0}
    ],
    "Grupo H": [
      {"pos":1,"equipo":"Inglaterra","pj":3,"pg":3,"pe":0,"pp":0,"gf":7,"gc":1,"dg":6,"pts":9},
      {"pos":2,"equipo":"Panamá","pj":3,"pg":1,"pe":1,"pp":1,"gf":3,"gc":4,"dg":-1,"pts":4},
      {"pos":3,"equipo":"Irlanda","pj":3,"pg":0,"pe":2,"pp":1,"gf":2,"gc":4,"dg":-2,"pts":2},
      {"pos":4,"equipo":"Albania","pj":3,"pg":0,"pe":1,"pp":2,"gf":1,"gc":4,"dg":-3,"pts":1}
    ],
    "Grupo I": [
      {"pos":1,"equipo":"Alemania","pj":3,"pg":2,"pe":1,"pp":0,"gf":7,"gc":3,"dg":4,"pts":7},
      {"pos":2,"equipo":"Japón","pj":3,"pg":1,"pe":2,"pp":0,"gf":4,"gc":3,"dg":1,"pts":5},
      {"pos":3,"equipo":"Irán","pj":3,"pg":0,"pe":2,"pp":1,"gf":3,"gc":4,"dg":-1,"pts":2},
      {"pos":4,"equipo":"Paraguay","pj":3,"pg":0,"pe":1,"pp":2,"gf":2,"gc":6,"dg":-4,"pts":1}
    ],
    "Grupo J": [
      {"pos":1,"equipo":"Argentina","pj":3,"pg":3,"pe":0,"pp":0,"gf":8,"gc":1,"dg":7,"pts":9},
      {"pos":2,"equipo":"Jordania","pj":3,"pg":1,"pe":0,"pp":2,"gf":3,"gc":6,"dg":-3,"pts":3},
      {"pos":3,"equipo":"Argelia","pj":3,"pg":1,"pe":0,"pp":2,"gf":2,"gc":4,"dg":-2,"pts":3},
      {"pos":4,"equipo":"Austria","pj":3,"pg":0,"pe":0,"pp":3,"gf":1,"gc":3,"dg":-2,"pts":0}
    ],
    "Grupo K": [
      {"pos":1,"equipo":"Países Bajos","pj":3,"pg":2,"pe":1,"pp":0,"gf":6,"gc":3,"dg":3,"pts":7},
      {"pos":2,"equipo":"Marruecos","pj":3,"pg":2,"pe":0,"pp":1,"gf":5,"gc":4,"dg":1,"pts":6},
      {"pos":3,"equipo":"Uzbekistán","pj":3,"pg":1,"pe":0,"pp":2,"gf":4,"gc":6,"dg":-2,"pts":3},
      {"pos":4,"equipo":"RD Congo","pj":3,"pg":0,"pe":1,"pp":2,"gf":2,"gc":4,"dg":-2,"pts":1}
    ],
    "Grupo L": [
      {"pos":1,"equipo":"Italia","pj":3,"pg":2,"pe":0,"pp":1,"gf":5,"gc":3,"dg":2,"pts":6},
      {"pos":2,"equipo":"Noruega","pj":3,"pg":2,"pe":0,"pp":1,"gf":6,"gc":4,"dg":2,"pts":6},
      {"pos":3,"equipo":"Arabia Saud.","pj":3,"pg":1,"pe":0,"pp":2,"gf":3,"gc":5,"dg":-2,"pts":3},
      {"pos":4,"equipo":"Costa Rica","pj":3,"pg":0,"pe":0,"pp":3,"gf":1,"gc":3,"dg":-2,"pts":0}
    ]
  }
};

loadJSON(DEFAULT_JSON);