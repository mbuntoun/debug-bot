require('dotenv').config();
const express = require('express');
const path = require('path');

const chatRoutes = require('./routes/chat');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/chat', chatRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Debug bot running at http://127.0.0.1:${PORT}`);
});
