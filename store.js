// JSON-file storage: data survives server restarts.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'registrations.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    return []; // corrupted file -> start clean rather than crash
  }
}

// Write to a temp file then rename, so a crash mid-write can't corrupt data
function writeAll(list) {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, FILE);
}

module.exports = {
  all: (department) => {
    const list = readAll();
    return department ? list.filter((r) => r.department === department) : list;
  },
  countByPrn: (prn) => readAll().filter((r) => r.prn === prn).length,
  hasCourse: (prn, course) => readAll().some((r) => r.prn === prn && r.course === course),
  add: (data) => {
    const list = readAll();
    const nextId = list.length ? Math.max(...list.map((r) => r.id)) + 1 : 1;
    const record = { id: nextId, createdAt: new Date().toISOString(), ...data };
    list.push(record);
    writeAll(list);
    return record;
  },
  remove: (id) => {
    const list = readAll();
    const next = list.filter((r) => r.id !== id);
    if (next.length === list.length) return false;
    writeAll(next);
    return true;
  },
};
