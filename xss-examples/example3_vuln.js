const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  const q = req.query.q || '';
  // I’m just returning JSON here so I don’t have to worry about escaping anything
  res.json({
    results_for: q,
    message: "Search completed"
  });
});
module.exports = app;
