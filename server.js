const express = require('express');
const path = require('path');
const catalog = require('./catalog');
const store = require('./store');
const validate = require('./middleware/validate');
const { registrationRules, idRule, queryRules } = require('./validators/registrationValidator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Departments -> courses (used to fill the dropdowns)
app.get('/api/catalog', (req, res) => res.json({ success: true, catalog }));

// List registrations (optional ?department= filter, validated)
app.get('/api/registrations', queryRules, validate, (req, res) => {
  res.json({ success: true, registrations: store.all(req.query.department) });
});

// Create a registration: validate on the SERVER, then save to the JSON file
app.post('/api/registrations', registrationRules, validate, (req, res) => {
  // Whitelist fields so unexpected extra properties are never stored
  const { studentName, prn, email, phone, dob, department, year, course, rating, feedback } = req.body;
  const record = store.add({ studentName, prn, email, phone, dob, department, year, course, rating, feedback });
  res.status(201).json({ success: true, message: 'Registration & feedback submitted successfully!', registration: record });
});

// Delete a registration (route param validated)
app.delete('/api/registrations/:id', idRule, validate, (req, res) => {
  const removed = store.remove(req.params.id);
  if (!removed) return res.status(404).json({ success: false, message: 'Registration not found' });
  res.json({ success: true, message: 'Registration deleted' });
});

// 404 + error handlers
app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
