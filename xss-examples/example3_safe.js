const express = require('express');
const app = express();

// I kept the escape function so I can safely put the value inside HTML
const escapeHtml = s => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;');

app.get('/search', (req, res) => {
  const raw = req.query.q || '';
  const safe = escapeHtml(raw);

  // I still return HTML like in the original since that's what the route was meant to do
  res.send(`<h1>Results for ${safe}</h1>`);
});

module.exports = app;
