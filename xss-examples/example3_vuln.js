const express = require('express');
const app = express();

// I’m escaping HTML here so the search term can't break the page
function escapeHtml(text) {
  if (!text) return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.get('/search', (req, res) => {
  const q = req.query.q || '';

  // I sanitize the input before using it in the HTML
  const out = escapeHtml(q);
  res.send(`<h1>Results for ${out}</h1>`);
});

module.exports = app;
