const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'FORM_WITH_INTEGRATION.html'));
});

app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'FORM_WITH_INTEGRATION.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Форма доступна на http://localhost:${PORT}`);
});
