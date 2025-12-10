const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  const q = req.query.q || '';
  // FIXED: Returning JSON instead of HTML eliminates the XSS risk entirely.
  res.json({ 
    results_for: q,
    message: "Search completed"
  });
});

module.exports = app;
