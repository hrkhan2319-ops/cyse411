const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  const q = req.query.q || '';
  // FIXED: JSON response is safe by default.
  res.json({ 
    results_for: q,
    message: "No results found" 
  });
});

module.exports = app;
