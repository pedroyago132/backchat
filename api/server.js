import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api';

const app = express();

// Configurações
app.use(cors({
  origin: 'http://localhost:3000', // Ajuste para seu frontend
  methods: ['GET', 'OPTIONS']
}));
app.use(express.json());

// Rotas
app.use('/api', apiRouter);

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    success: false,
    error: 'Erro interno no servidor' 
  });
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});