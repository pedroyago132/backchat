require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Configurações iniciais
app.use(bodyParser.json());

// Importar serviços
const { initializeFirebase } = require('./firebase');
const { handleWebhook } = require('./handlers/webhookHandler');

// Inicializar Firebase
initializeFirebase();

// Rota para webhook da Z-API
app.post('/webhook', async (req, res) => {
  try {
    await handleWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).send('Erro interno');
  }
});

// Rota de health check
app.get('/', (req, res) => {
  res.send('Chatbot de agendamento está online!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});