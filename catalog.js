// Single source of truth: departments and the courses each one offers.
// Used by BOTH the validator (server) and the dropdowns (client via /api/catalog).
module.exports = {
  'Computer Science': ['Data Structures', 'Operating Systems', 'Database Systems', 'Web Technologies'],
  'Electronics':      ['Digital Electronics', 'Microprocessors', 'Signal Processing', 'VLSI Design'],
  'Mechanical':       ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Robotics'],
  'Civil':            ['Structural Analysis', 'Surveying', 'Concrete Technology', 'Geotechnical Engineering'],
};
