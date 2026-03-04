/* ═══════════════════════════════════════════════════════════════════════════
   FinanceOS — app.js
   Gestionnaire Financier Personnel
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ── CATEGORIES ──────────────────────────────────────────────────────────── */
const CATEGORIES = {
  revenu: ['Salaire', 'Freelance', 'Investissements', 'Remboursement', 'Autre revenu'],
  depense: [
    'Logement', 'Alimentation', 'Transport', 'Santé',
    'Loisirs', 'Vêtements', 'Éducation', 'Abonnements',
    'Épargne', 'Autre dépense'
  ]
};

const PIE_COLORS = [
  '#4f8ef7','#2dd4a0','#f7c94f','#f7614f',
  '#c084fc','#60a5fa','#34d399','#f97316',
  '#e879f9','#38bdf8'
];

/* ── STATE ───────────────────────────────────────────────────────────────── */
let transactions = [];
let deleteTargetId = null;
let currentPeriod = 'monthly';
let activeView = 'dashboard';

/* ── STORAGE ─────────────────────────────────────────────────────────────── */
function saveData() {
  localStorage.setItem('financeOS_transactions', JSON.stringify(transactions));
}

function loadData() {
  const raw = localStorage.getItem('financeOS_transactions');
  if (raw) {
    try { transactions = JSON.parse(raw); } catch { transactions = []; }
  } else {
    // Seed with sample data on first load
    transactions = generateSeedData();
    saveData();
  }
}

function generateSeedData() {
  const now = new Date();
  const samples = [];
  const months = [-2, -1, 0];

  months.forEach(offset => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const y = d.getFullYear();
    const m = d.getMonth();

    samples.push(
      { id: uid(), description: 'Salaire', amount: 350000, type: 'revenu',  category: 'Salaire',       date: fmtDate(new Date(y,m,1)) },
      { id: uid(), description: 'Freelance web',  amount: 85000, type: 'revenu', category: 'Freelance',      date: fmtDate(new Date(y,m,15)) },
      { id: uid(), description: 'Loyer',           amount: 75000, type: 'depense', category: 'Logement',      date: fmtDate(new Date(y,m,3)) },
      { id: uid(), description: 'Courses alimentaires', amount: 45000, type: 'depense', category: 'Alimentation', date: fmtDate(new Date(y,m,8)) },
      { id: uid(), description: 'Transport (bus / taxi)', amount: 15000, type: 'depense', category: 'Transport', date: fmtDate(new Date(y,m,2)) },
      { id: uid(), description: 'Canal+ / Orange', amount: 12500, type: 'depense', category: 'Abonnements', date: fmtDate(new Date(y,m,10)) },
      { id: uid(), description: 'Restaurant', amount: 8500, type: 'depense', category: 'Alimentation', date: fmtDate(new Date(y,m,20)) },
      { id: uid(), description: 'Électricité / eau (SENELEC)', amount: 18000, type: 'depense', category: 'Logement', date: fmtDate(new Date(y,m,5)) },
    );
  });

  return samples.map((t, i) => ({ ...t, id: `seed_${i}` }));
}

/* ── UTILITIES ───────────────────────────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function fmtCurrency(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

function fmtDateDisplay(str) {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function getMonthKey(dateStr) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-S${String(week).padStart(2, '0')}`;
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

/* ── CALCULATIONS ────────────────────────────────────────────────────────── */
function calcTotals(txs = transactions) {
  let income = 0, expense = 0;
  txs.forEach(t => {
    if (t.type === 'revenu') income += t.amount;
    else expense += t.amount;
  });
  return { income, expense, balance: income - expense };
}

function calcAvgMonthlyExpense() {
  if (!transactions.length) return 0;
  const months = new Set(transactions.filter(t => t.type === 'depense').map(t => getMonthKey(t.date)));
  if (!months.size) return 0;
  const { expense } = calcTotals();
  return expense / months.size;
}

function expensesByCategory(txs = transactions) {
  const map = {};
  txs.filter(t => t.type === 'depense').forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return map;
}

function balanceByMonth() {
  const map = {};
  transactions.forEach(t => {
    const k = getMonthKey(t.date);
    if (!map[k]) map[k] = { income: 0, expense: 0 };
    if (t.type === 'revenu') map[k].income += t.amount;
    else map[k].expense += t.amount;
  });

  const sorted = Object.keys(map).sort().slice(-6);
  return sorted.map(k => ({
    label: k,
    balance: map[k].income - map[k].expense,
    income: map[k].income,
    expense: map[k].expense
  }));
}

/* ── ROUTING / VIEWS ─────────────────────────────────────────────────────── */
function switchView(view) {
  activeView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const el = document.getElementById(`view-${view}`);
  if (el) el.classList.add('active');

  const nav = document.querySelector(`[data-view="${view}"]`);
  if (nav) nav.classList.add('active');

  const titles = {
    dashboard: 'Tableau de bord',
    transactions: 'Transactions',
    analytics: 'Analytique',
    add: 'Nouvelle transaction'
  };

  document.getElementById('pageTitle').textContent = titles[view] || view;

  // Close mobile sidebar
  document.querySelector('.sidebar').classList.remove('open');

  renderView(view);
}

function renderView(view) {
  switch (view) {
    case 'dashboard':    renderDashboard(); break;
    case 'transactions': renderTransactions(); break;
    case 'analytics':    renderAnalytics(); break;
    case 'add':          /* form is static */ break;
  }
}

/* ── DASHBOARD ───────────────────────────────────────────────────────────── */
function renderDashboard() {
  const { income, expense, balance } = calcTotals();
  const avg = calcAvgMonthlyExpense();

  // KPIs
  document.getElementById('kpiBalance').textContent = fmtCurrency(balance);
  document.getElementById('kpiIncome').textContent  = fmtCurrency(income);
  document.getElementById('kpiExpense').textContent = fmtCurrency(expense);
  document.getElementById('kpiAvg').textContent     = fmtCurrency(avg);

  // Chip
  document.getElementById('chipBalance').textContent = fmtCurrency(balance);
  document.getElementById('chipBalance').style.color = balance < 0 ? 'var(--red)' : 'var(--green)';

  // Alert
  const alertBar = document.getElementById('alertBar');
  alertBar.style.display = balance < 0 ? 'flex' : 'none';

  // Charts
  renderPieChart();
  renderBarChart();

  // Recent
  renderRecentTransactions();
}

function renderBalanceSummary() {
  // update topbar chip always
  const { balance } = calcTotals();
  document.getElementById('chipBalance').textContent = fmtCurrency(balance);
  document.getElementById('chipBalance').style.color = balance < 0 ? 'var(--red)' : 'var(--green)';
  document.getElementById('alertBar').style.display = balance < 0 ? 'flex' : 'none';
}

/* ── PIE CHART ───────────────────────────────────────────────────────────── */
function renderPieChart() {
  const svg = document.getElementById('pieChart');
  const legend = document.getElementById('pieLegend');
  const empty = document.getElementById('pieEmpty');
  const container = document.querySelector('.pie-container');

  const cats = expensesByCategory();
  const total = Object.values(cats).reduce((s, v) => s + v, 0);

  if (!total) {
    container.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  container.style.display = 'flex';
  empty.style.display = 'none';

  svg.innerHTML = '';
  legend.innerHTML = '';

  const cx = 100, cy = 100, r = 80, ir = 50;
  let angle = -Math.PI / 2;

  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);

  entries.forEach(([cat, val], i) => {
    const pct = val / total;
    const sweep = pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep);
    const y2 = cy + r * Math.sin(angle + sweep);
    const ix1 = cx + ir * Math.cos(angle);
    const iy1 = cy + ir * Math.sin(angle);
    const ix2 = cx + ir * Math.cos(angle + sweep);
    const iy2 = cy + ir * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const color = PIE_COLORS[i % PIE_COLORS.length];

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d',
      `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}
       L ${ix2} ${iy2} A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1} Z`
    );
    path.setAttribute('fill', color);
    path.setAttribute('opacity', '0.9');
    path.style.cursor = 'pointer';
    path.style.transition = 'opacity .2s';
    path.addEventListener('mouseenter', () => path.setAttribute('opacity', '1'));
    path.addEventListener('mouseleave', () => path.setAttribute('opacity', '0.9'));

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${cat} : ${fmtCurrency(val)} (${(pct * 100).toFixed(1)}%)`;
    path.appendChild(title);
    svg.appendChild(path);

    // Legend item
    const li = document.createElement('div');
    li.className = 'legend-item';
    li.innerHTML = `
      <span class="legend-dot" style="background:${color}"></span>
      <span class="legend-name">${cat}</span>
      <span class="legend-pct">${(pct * 100).toFixed(0)}%</span>
    `;
    legend.appendChild(li);

    angle += sweep;
  });

  // Center label
  const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text1.setAttribute('x', cx); text1.setAttribute('y', cy - 4);
  text1.setAttribute('text-anchor', 'middle');
  text1.setAttribute('fill', '#8fa4c4');
  text1.setAttribute('font-size', '9');
  text1.textContent = 'Dépenses';
  svg.appendChild(text1);

  const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text2.setAttribute('x', cx); text2.setAttribute('y', cy + 12);
  text2.setAttribute('text-anchor', 'middle');
  text2.setAttribute('fill', '#e4ecf8');
  text2.setAttribute('font-size', '12');
  text2.setAttribute('font-weight', '600');
  text2.textContent = fmtCurrency(Object.values(cats).reduce((s,v) => s+v, 0));
  svg.appendChild(text2);
}

/* ── BAR CHART (solde par mois) ──────────────────────────────────────────── */
function renderBarChart() {
  const svg = document.getElementById('barChart');
  const empty = document.getElementById('barEmpty');
  const data = balanceByMonth();

  svg.innerHTML = '';

  if (!data.length) {
    svg.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  svg.style.display = 'block';
  empty.style.display = 'none';

  const W = 420, H = 180, padL = 60, padB = 32, padT = 14, padR = 14;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const values = data.map(d => d.balance);
  const maxAbs = Math.max(Math.abs(Math.min(...values)), Math.max(...values), 1);
  const yScale = v => padT + chartH / 2 - (v / maxAbs) * (chartH / 2);
  const zeroY = padT + chartH / 2;

  const barW = Math.min(40, (chartW / data.length) * 0.55);
  const step = chartW / data.length;

  // Zero line
  const zLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  zLine.setAttribute('x1', padL); zLine.setAttribute('x2', W - padR);
  zLine.setAttribute('y1', zeroY); zLine.setAttribute('y2', zeroY);
  zLine.setAttribute('stroke', '#2a3347'); zLine.setAttribute('stroke-width', '1');
  svg.appendChild(zLine);

  // Gridlines
  [-1, -.5, .5, 1].forEach(f => {
    const y = padT + chartH / 2 - f * (chartH / 2);
    const gl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gl.setAttribute('x1', padL); gl.setAttribute('x2', W - padR);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y);
    gl.setAttribute('stroke', '#1e2535'); gl.setAttribute('stroke-width', '1');
    gl.setAttribute('stroke-dasharray', '3 4');
    svg.appendChild(gl);
  });

  // Bars
  data.forEach((d, i) => {
    const cx = padL + step * i + step / 2;
    const y = yScale(d.balance);
    const h = Math.abs(zeroY - y);
    const barY = d.balance >= 0 ? y : zeroY;
    const color = d.balance >= 0 ? '#2dd4a0' : '#f7614f';

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', cx - barW / 2);
    rect.setAttribute('y', barY);
    rect.setAttribute('width', barW);
    rect.setAttribute('height', Math.max(h, 2));
    rect.setAttribute('fill', color);
    rect.setAttribute('opacity', '0.85');
    rect.setAttribute('rx', '3');
    rect.style.cursor = 'pointer';
    rect.style.transition = 'opacity .2s';
    rect.addEventListener('mouseenter', () => rect.setAttribute('opacity', '1'));
    rect.addEventListener('mouseleave', () => rect.setAttribute('opacity', '0.85'));

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${d.label} : ${fmtCurrency(d.balance)}`;
    rect.appendChild(title);
    svg.appendChild(rect);

    // Month label
    const [yr, mo] = d.label.split('-');
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const label = months[parseInt(mo, 10) - 1];

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', cx); txt.setAttribute('y', H - 6);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('fill', '#506080');
    txt.setAttribute('font-size', '9');
    txt.textContent = label;
    svg.appendChild(txt);
  });

  // Y axis labels
  const yLabels = [maxAbs, 0, -maxAbs];
  yLabels.forEach(v => {
    const y = yScale(v);
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', padL - 6); t.setAttribute('y', y + 4);
    t.setAttribute('text-anchor', 'end');
    t.setAttribute('fill', '#506080');
    t.setAttribute('font-size', '8');
    t.textContent = fmtCurrency(v).replace(/[A-Z\s\u202f\u00a0]/g, '');
    svg.appendChild(t);
  });
}

/* ── RECENT TRANSACTIONS ─────────────────────────────────────────────────── */
function renderRecentTransactions() {
  const list = document.getElementById('recentList');
  const empty = document.getElementById('recentEmpty');
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  if (!recent.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = recent.map(t => buildTxRowHTML(t, false)).join('');
}

function buildTxRowHTML(t, withActions = true) {
  const cls = t.type === 'revenu' ? 'income' : 'expense';
  const sign = t.type === 'revenu' ? '+' : '-';
  const actions = withActions ? `
    <div class="tx-actions">
      <button class="btn-icon" onclick="editTransaction('${t.id}')" title="Modifier">
        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="btn-icon delete" onclick="confirmDelete('${t.id}')" title="Supprimer">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
      </button>
    </div>` : '';

  return `
    <div class="tx-row">
      <span class="tx-type-dot ${cls}"></span>
      <span class="tx-desc">${escHtml(t.description)}</span>
      <span class="tx-cat">${escHtml(t.category)}</span>
      <span class="tx-date">${fmtDateDisplay(t.date)}</span>
      <span class="tx-amount ${cls}">${sign}${fmtCurrency(t.amount)}</span>
      ${actions}
    </div>`;
}

/* ── TRANSACTIONS VIEW ───────────────────────────────────────────────────── */
function renderTransactions() {
  const type = document.getElementById('filterType').value;
  const cat  = document.getElementById('filterCat').value;
  const month = document.getElementById('filterMonth').value;

  let filtered = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  if (type)  filtered = filtered.filter(t => t.type === type);
  if (cat)   filtered = filtered.filter(t => t.category === cat);
  if (month) filtered = filtered.filter(t => t.date.startsWith(month));

  document.getElementById('txCount').textContent = `${filtered.length} transaction(s)`;

  const body = document.getElementById('txTableBody');
  const empty = document.getElementById('txEmpty');

  if (!filtered.length) {
    body.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  body.innerHTML = filtered.map(t => `
    <tr>
      <td><span style="font-family:'Fira Code',monospace;font-size:.82rem">${fmtDateDisplay(t.date)}</span></td>
      <td style="color:var(--text);font-weight:500">${escHtml(t.description)}</td>
      <td>${escHtml(t.category)}</td>
      <td><span class="badge ${t.type === 'revenu' ? 'income' : 'expense'}">${t.type === 'revenu' ? 'Revenu' : 'Dépense'}</span></td>
      <td class="text-right" style="font-family:'Fira Code',monospace;color:${t.type === 'revenu' ? 'var(--green)' : 'var(--red)'}">
        ${t.type === 'revenu' ? '+' : '-'}${fmtCurrency(t.amount)}
      </td>
      <td class="text-center">
        <div style="display:flex;gap:4px;justify-content:center">
          <button class="btn-icon" onclick="editTransaction('${t.id}')" title="Modifier">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon delete" onclick="confirmDelete('${t.id}')" title="Supprimer">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');

  renderCompareTable(filtered);
}

function renderCompareTable(filtered) {
  const wrap = document.getElementById('compareTable');

  const byMonth = {};
  filtered.forEach(t => {
    const k = getMonthKey(t.date);
    if (!byMonth[k]) byMonth[k] = { income: 0, expense: 0, count: 0 };
    if (t.type === 'revenu') byMonth[k].income += t.amount;
    else byMonth[k].expense += t.amount;
    byMonth[k].count++;
  });

  const keys = Object.keys(byMonth).sort().reverse();
  if (!keys.length) { wrap.innerHTML = '<p style="color:var(--text-3);font-size:.85rem;padding:12px 0">Aucune donnée</p>'; return; }

  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  wrap.innerHTML = `
    <table class="tx-table">
      <thead><tr>
        <th>Période</th>
        <th class="text-right">Revenus</th>
        <th class="text-right">Dépenses</th>
        <th class="text-right">Solde</th>
        <th class="text-right">Transactions</th>
      </tr></thead>
      <tbody>
        ${keys.map(k => {
          const [yr, mo] = k.split('-');
          const d = byMonth[k];
          const bal = d.income - d.expense;
          return `<tr>
            <td style="font-weight:600;color:var(--text)">${months[parseInt(mo,10)-1]} ${yr}</td>
            <td class="text-right" style="color:var(--green);font-family:'Fira Code',monospace">${fmtCurrency(d.income)}</td>
            <td class="text-right" style="color:var(--red);font-family:'Fira Code',monospace">${fmtCurrency(d.expense)}</td>
            <td class="text-right" style="color:${bal>=0?'var(--green)':'var(--red)'};font-family:'Fira Code',monospace;font-weight:600">${fmtCurrency(bal)}</td>
            <td class="text-right" style="color:var(--text-3)">${d.count}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function populateCategoryFilter() {
  const sel = document.getElementById('filterCat');
  const current = sel.value;
  sel.innerHTML = '<option value="">Toutes catégories</option>';
  const allCats = [...CATEGORIES.revenu, ...CATEGORIES.depense];
  allCats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  });
  sel.value = current;
}

/* ── ANALYTICS ───────────────────────────────────────────────────────────── */
function renderAnalytics() {
  renderGroupedBarChart();
  renderStats();
  renderTopExpenses();
}

function renderGroupedBarChart() {
  const svg = document.getElementById('groupedBar');
  const empty = document.getElementById('groupedEmpty');
  svg.innerHTML = '';

  const keyFn = currentPeriod === 'monthly' ? getMonthKey : getWeekKey;
  const map = {};

  transactions.forEach(t => {
    const k = keyFn(t.date);
    if (!map[k]) map[k] = { income: 0, expense: 0 };
    if (t.type === 'revenu') map[k].income += t.amount;
    else map[k].expense += t.amount;
  });

  const keys = Object.keys(map).sort().slice(-8);
  if (!keys.length) {
    svg.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  svg.style.display = 'block';
  empty.style.display = 'none';

  const W = 600, H = 200, padL = 70, padB = 36, padT = 14, padR = 14;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxVal = Math.max(...keys.flatMap(k => [map[k].income, map[k].expense]), 1);
  const yScale = v => padT + chartH - (v / maxVal) * chartH;

  const groupW = chartW / keys.length;
  const bW = Math.min(22, groupW * 0.35);
  const gap = 4;

  // Grid
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const y = padT + chartH * (1 - f);
    const gl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gl.setAttribute('x1', padL); gl.setAttribute('x2', W - padR);
    gl.setAttribute('y1', y);   gl.setAttribute('y2', y);
    gl.setAttribute('stroke', '#1e2535'); gl.setAttribute('stroke-width', '1');
    gl.setAttribute('stroke-dasharray', '3 4');
    svg.appendChild(gl);

    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', padL - 6); t.setAttribute('y', y + 4);
    t.setAttribute('text-anchor', 'end'); t.setAttribute('fill', '#506080');
    t.setAttribute('font-size', '8');
    t.textContent = fmtCurrency(maxVal * f).replace(/[A-Z\s\u202f\u00a0]/g,'');
    svg.appendChild(t);
  });

  keys.forEach((k, i) => {
    const cx = padL + groupW * i + groupW / 2;

    // Income bar
    const ih = Math.max((map[k].income / maxVal) * chartH, 2);
    const ir = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ir.setAttribute('x', cx - bW - gap / 2); ir.setAttribute('y', yScale(map[k].income));
    ir.setAttribute('width', bW); ir.setAttribute('height', ih);
    ir.setAttribute('fill', '#2dd4a0'); ir.setAttribute('opacity', '0.85'); ir.setAttribute('rx', '3');
    ir.style.cursor = 'pointer';
    const it = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    it.textContent = `Revenus ${k} : ${fmtCurrency(map[k].income)}`;
    ir.appendChild(it);
    svg.appendChild(ir);

    // Expense bar
    const eh = Math.max((map[k].expense / maxVal) * chartH, 2);
    const er = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    er.setAttribute('x', cx + gap / 2); er.setAttribute('y', yScale(map[k].expense));
    er.setAttribute('width', bW); er.setAttribute('height', eh);
    er.setAttribute('fill', '#f7614f'); er.setAttribute('opacity', '0.85'); er.setAttribute('rx', '3');
    er.style.cursor = 'pointer';
    const et = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    et.textContent = `Dépenses ${k} : ${fmtCurrency(map[k].expense)}`;
    er.appendChild(et);
    svg.appendChild(er);

    // X label
    let label = k;
    if (currentPeriod === 'monthly') {
      const [yr, mo] = k.split('-');
      const mos = ['J','F','M','A','M','J','J','A','S','O','N','D'];
      label = `${mos[parseInt(mo,10)-1]} ${yr.slice(2)}`;
    }

    const xt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xt.setAttribute('x', cx); xt.setAttribute('y', H - 8);
    xt.setAttribute('text-anchor', 'middle'); xt.setAttribute('fill', '#506080');
    xt.setAttribute('font-size', '8');
    xt.textContent = label;
    svg.appendChild(xt);
  });

  // Legend
  const legendData = [{ color: '#2dd4a0', label: 'Revenus' }, { color: '#f7614f', label: 'Dépenses' }];
  legendData.forEach((l, i) => {
    const x = W - padR - 140 + i * 70;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', padT);
    rect.setAttribute('width', 10); rect.setAttribute('height', 10);
    rect.setAttribute('fill', l.color); rect.setAttribute('rx', '2');
    svg.appendChild(rect);

    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x + 14); t.setAttribute('y', padT + 9);
    t.setAttribute('fill', '#8fa4c4'); t.setAttribute('font-size', '9');
    t.textContent = l.label;
    svg.appendChild(t);
  });
}

function renderStats() {
  const body = document.getElementById('statsBody');
  const { income, expense, balance } = calcTotals();
  const avg = calcAvgMonthlyExpense();

  const months = new Set(transactions.map(t => getMonthKey(t.date)));
  const weeks  = new Set(transactions.map(t => getWeekKey(t.date)));
  const avgWeek = weeks.size ? transactions.filter(t=>t.type==='depense').reduce((s,t)=>s+t.amount,0) / weeks.size : 0;
  const avgDay  = months.size ? expense / (months.size * 30) : 0;

  const rows = [
    { label: 'Total revenus',         val: fmtCurrency(income),   color: 'var(--green)' },
    { label: 'Total dépenses',        val: fmtCurrency(expense),  color: 'var(--red)' },
    { label: 'Solde global',          val: fmtCurrency(balance),  color: balance >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Moy. dépenses/mois',   val: fmtCurrency(avg),       color: 'var(--amber)' },
    { label: 'Moy. dépenses/semaine', val: fmtCurrency(avgWeek),  color: 'var(--amber)' },
    { label: 'Moy. dépenses/jour',    val: fmtCurrency(avgDay),   color: 'var(--amber)' },
    { label: 'Nb. de transactions',   val: transactions.length,   color: 'var(--blue)' },
    { label: 'Périodes couvertes',    val: `${months.size} mois`, color: 'var(--text-2)' },
  ];

  body.innerHTML = rows.map(r => `
    <div class="stat-row">
      <span class="stat-lbl">${r.label}</span>
      <span class="stat-val" style="color:${r.color}">${r.val}</span>
    </div>`).join('');
}

function renderTopExpenses() {
  const list = document.getElementById('topExpenses');
  const empty = document.getElementById('topEmpty');
  const cats = expensesByCategory();
  const total = Object.values(cats).reduce((s, v) => s + v, 0);

  if (!total) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxV = sorted[0][1];

  list.innerHTML = sorted.map(([cat, val], i) => `
    <div class="top-item">
      <span class="top-rank">${String(i+1).padStart(2,'0')}</span>
      <div class="top-bar-wrap">
        <div class="top-bar-label">
          <span>${escHtml(cat)}</span>
          <span style="font-family:'Fira Code',monospace;color:var(--red)">${fmtCurrency(val)}</span>
        </div>
        <div class="top-bar-track">
          <div class="top-bar-fill" style="width:${(val/maxV*100).toFixed(1)}%"></div>
        </div>
      </div>
    </div>`).join('');
}

/* ── FORM ────────────────────────────────────────────────────────────────── */
function populateCategorySelect() {
  const sel = document.getElementById('fCategory');
  const type = document.querySelector('.type-btn.active')?.dataset.type || 'revenu';
  const current = sel.value;
  sel.innerHTML = '<option value="">-- Sélectionner --</option>';
  CATEGORIES[type].forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  });
  // Try to keep selected if still valid
  if (CATEGORIES[type].includes(current)) sel.value = current;
}

function validateForm() {
  let valid = true;

  const fields = [
    { id: 'fDesc',     err: 'errDesc',    check: v => v.trim().length > 0, msg: 'La description est requise' },
    { id: 'fAmount',   err: 'errAmount',  check: v => parseFloat(v) > 0,   msg: 'Montant invalide (doit être > 0)' },
    { id: 'fCategory', err: 'errCategory',check: v => v !== '',            msg: 'Veuillez choisir une catégorie' },
    { id: 'fDate',     err: 'errDate',    check: v => v !== '',            msg: 'La date est requise' },
  ];

  fields.forEach(f => {
    const el = document.getElementById(f.id);
    const errEl = document.getElementById(f.err);
    if (!f.check(el.value)) {
      el.classList.add('error');
      errEl.textContent = f.msg;
      valid = false;
    } else {
      el.classList.remove('error');
      errEl.textContent = '';
    }
  });

  return valid;
}

function resetForm() {
  document.getElementById('txForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('formTitle').textContent = 'Nouvelle transaction';
  document.getElementById('btnCancelEdit').style.display = 'none';
  document.querySelectorAll('.form-error').forEach(e => e.textContent = '');
  document.querySelectorAll('.form-input').forEach(e => e.classList.remove('error'));

  // Reset type toggle
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-type="revenu"]').classList.add('active');
  populateCategorySelect();

  // Default date = today
  document.getElementById('fDate').value = fmtDate(new Date());
}

function editTransaction(id) {
  const t = transactions.find(x => x.id === id);
  if (!t) return;

  switchView('add');

  setTimeout(() => {
    document.getElementById('editId').value = id;
    document.getElementById('fDesc').value = t.description;
    document.getElementById('fAmount').value = t.amount;
    document.getElementById('fDate').value = t.date;
    document.getElementById('formTitle').textContent = 'Modifier la transaction';
    document.getElementById('btnCancelEdit').style.display = 'inline-flex';

    // Type toggle
    document.querySelectorAll('.type-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.type === t.type);
    });

    populateCategorySelect();
    document.getElementById('fCategory').value = t.category;
  }, 50);
}

/* ── DELETE ──────────────────────────────────────────────────────────────── */
function confirmDelete(id) {
  deleteTargetId = id;
  document.getElementById('modalOverlay').classList.add('open');
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  renderBalanceSummary();
  renderView(activeView);
  showToast('Transaction supprimée', 'info');
}

/* ── EXPORT CSV ──────────────────────────────────────────────────────────── */
function exportCSV() {
  if (!transactions.length) { showToast('Aucune donnée à exporter', 'error'); return; }

  const headers = ['ID','Date','Description','Type','Catégorie','Montant (FCFA)'];
  const rows = transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(t => [
      t.id,
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.type === 'revenu' ? 'Revenu' : 'Dépense',
      `"${t.category}"`,
      t.amount.toFixed(2)
    ].join(';'));

  const csv = [headers.join(';'), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `finances_${fmtDate(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Export CSV téléchargé', 'success');
}

/* ── HELPERS ─────────────────────────────────────────────────────────────── */
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── INIT & EVENT LISTENERS ──────────────────────────────────────────────── */
function init() {
  loadData();
  populateCategoryFilter();

  // Default date
  document.getElementById('fDate').value = fmtDate(new Date());
  populateCategorySelect();

  // Nav
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const view = el.dataset.view;
      if (view === 'add') resetForm();
      switchView(view);
    });
  });

  // Hamburger
  document.getElementById('hamburger').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
  });

  // Type toggle
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('errType').textContent = '';
      populateCategorySelect();
    });
  });

  // Form submit
  document.getElementById('txForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm()) return;

    const id = document.getElementById('editId').value;
    const tx = {
      id: id || uid(),
      description: document.getElementById('fDesc').value.trim(),
      amount: parseFloat(document.getElementById('fAmount').value),
      type: document.querySelector('.type-btn.active').dataset.type,
      category: document.getElementById('fCategory').value,
      date: document.getElementById('fDate').value
    };

    if (id) {
      transactions = transactions.map(t => t.id === id ? tx : t);
      showToast('Transaction modifiée ✓', 'success');
    } else {
      transactions.unshift(tx);
      showToast('Transaction ajoutée ✓', 'success');
    }

    saveData();
    renderBalanceSummary();
    resetForm();
    switchView('dashboard');
  });

  // Cancel edit
  document.getElementById('btnCancelEdit').addEventListener('click', () => {
    resetForm();
    switchView('transactions');
  });

  // Filters
  ['filterType','filterCat','filterMonth'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderTransactions);
  });

  document.getElementById('btnResetFilters').addEventListener('click', () => {
    document.getElementById('filterType').value = '';
    document.getElementById('filterCat').value = '';
    document.getElementById('filterMonth').value = '';
    renderTransactions();
  });

  // Period tabs
  document.querySelectorAll('.ptab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPeriod = tab.dataset.period;
      renderGroupedBarChart();
    });
  });

  // Export
  document.getElementById('btnExport').addEventListener('click', exportCSV);

  // Modal
  document.getElementById('modalCancel').addEventListener('click', () => {
    document.getElementById('modalOverlay').classList.remove('open');
    deleteTargetId = null;
  });

  document.getElementById('modalConfirm').addEventListener('click', () => {
    document.getElementById('modalOverlay').classList.remove('open');
    if (deleteTargetId) deleteTransaction(deleteTargetId);
    deleteTargetId = null;
  });

  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('open');
      deleteTargetId = null;
    }
  });

  // Real-time validation
  ['fDesc','fAmount','fCategory','fDate'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      const el = document.getElementById(id);
      if (el.value) {
        el.classList.remove('error');
        const errId = 'err' + id.charAt(1).toUpperCase() + id.slice(2);
        const errEl = document.getElementById(errId);
        if (errEl) errEl.textContent = '';
      }
    });
  });

  // Initial render
  switchView('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
