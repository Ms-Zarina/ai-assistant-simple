const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
const FORM = path.join(__dirname, 'FORM_KNOWLEDGE_BASE.html');
const sendForm = (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set('Cache-Control', 'no-cache');
  res.sendFile(FORM);
};

app.get('/', sendForm);
app.get('/form', sendForm);
app.get('/healthz', (req, res) => res.send('ok'));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`✅ Форма доступна на http://localhost:${PORT}`);
});
