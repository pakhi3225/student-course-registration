const $ = (id) => document.getElementById(id);
const form = $('regForm');
const FIELDS = ['studentName', 'prn', 'email', 'phone', 'dob', 'department', 'year', 'course', 'rating', 'feedback'];
let catalog = {};

/* ---------- helpers ---------- */
function clearErrors() {
  document.querySelectorAll('.error').forEach((el) => (el.textContent = ''));
  document.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
  $('result').hidden = true;
}

function showErrors(errors) {
  Object.entries(errors).forEach(([field, msg]) => {
    const small = document.querySelector(`.error[data-for="${field}"]`);
    if (small) small.textContent = msg;
    const input = $(field);
    if (input) input.classList.add('invalid');
  });
}

function showResult(text, ok) {
  const box = $('result');
  box.textContent = text;
  box.className = 'result ' + (ok ? 'ok' : 'bad');
  box.hidden = false;
}

function setRaw(status, data) {
  $('raw').textContent = `HTTP ${status}\n` + JSON.stringify(data, null, 2);
}

function fillOptions(select, items, placeholder) {
  select.innerHTML = '';
  const first = document.createElement('option');
  first.value = '';
  first.textContent = placeholder;
  select.appendChild(first);
  items.forEach((v) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  });
}

/* ---------- catalog / dropdowns ---------- */
async function loadCatalog() {
  const res = await fetch('/api/catalog');
  catalog = (await res.json()).catalog;
  const depts = Object.keys(catalog);
  fillOptions($('department'), depts, '-- Select --');
  fillOptions($('filterDept'), depts, 'All departments');
}

$('department').addEventListener('change', () => {
  const courses = catalog[$('department').value] || [];
  fillOptions($('course'), courses, courses.length ? '-- Select --' : '-- Select department first --');
});

$('feedback').addEventListener('input', () => {
  $('counter').textContent = `${$('feedback').value.length}/300`;
});

/* ---------- submit ---------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const payload = { declaration: $('declaration').checked };
  FIELDS.forEach((f) => (payload[f] = $(f).value));

  try {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setRaw(res.status, data);

    if (res.status === 201) {
      showResult('✅ ' + data.message, true);
      form.reset();
      $('counter').textContent = '0/300';
      fillOptions($('course'), [], '-- Select department first --');
      loadRecords();
    } else if (res.status === 422) {
      showErrors(data.errors);
      showResult('❌ The server rejected the data. Fix the highlighted fields.', false);
    } else {
      showResult('❌ ' + (data.message || 'Something went wrong'), false);
    }
  } catch (err) {
    showResult('❌ Could not reach the server.', false);
  }
});

/* ---------- records table ---------- */
async function loadRecords() {
  const dept = $('filterDept').value;
  const res = await fetch('/api/registrations' + (dept ? `?department=${encodeURIComponent(dept)}` : ''));
  const data = await res.json();
  const tbody = $('tbody');
  tbody.innerHTML = '';

  const list = data.registrations || [];
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="muted">No registrations yet.</td></tr>';
    $('avg').textContent = '';
    return;
  }

  list.forEach((r) => {
    const tr = document.createElement('tr');
    [r.id, r.studentName, r.prn, `${r.course} (${r.department})`, '★'.repeat(r.rating)].forEach((val) => {
      const td = document.createElement('td');
      td.textContent = val; // textContent => safe from HTML injection
      tr.appendChild(td);
    });
    const td = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = 'Delete';
    btn.className = 'danger';
    btn.addEventListener('click', () => deleteRecord(r.id));
    td.appendChild(btn);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });

  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  $('avg').textContent = `(${list.length} total · avg rating ${avg.toFixed(1)}/5)`;
}

async function deleteRecord(id) {
  const res = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
  setRaw(res.status, await res.json());
  loadRecords();
}

$('filterDept').addEventListener('change', loadRecords);

loadCatalog().then(loadRecords);
