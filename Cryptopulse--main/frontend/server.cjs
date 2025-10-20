/* Minimal Express static server for Render (or Node) hosting - CommonJS */
const path = require('path');
const express = require('express');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 10000;
const distDir = path.join(__dirname, 'dist');

app.disable('x-powered-by');
app.use(compression());

app.use(
  express.static(distDir, {
    setHeaders: (res, filePath) => {
      if (/\.(js|css|woff2?|ttf)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/\.(png|jpg|jpeg|gif|svg|ico|webp)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=300');
      }
    },
  })
);

app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Frontend server listening on port ${PORT}`);
});
