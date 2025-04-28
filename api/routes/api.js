import express from 'express';
import { AvailabilityController } from '../controllers/availabilityController';
import { getDatabase, ref, set } from 'firebase/database';

const router = express.Router();
const db = getDatabase();
const availabilityController = new AvailabilityController(db);

/**
 * @route GET /api/availability/:date
 * @description Obtém horários e funcionários disponíveis para uma data
 * @param {string} date - Data no formato dd/mm
 * @returns {Object} - No formato especificado
 */
router.get('/availability/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.headers['x-user-id'] || '';

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    const result = await availabilityController.getAvailability(userId, date);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Erro no endpoint de disponibilidade:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno no servidor' 
    });
  }
});

/**
 * @route POST /api/appointments
 * @description Cria um novo agendamento
 * @param {Object} body - Dados do agendamento
 * @returns {Object} - Confirmação do agendamento
 */
router.post('/appointments', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || '';
    const {
      date,
      time,
      employeeId,
      clientName,
      clientPhone,
      service
    } = req.body;

    // Validações básicas
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    if (!date || !time || !employeeId || !clientName || !clientPhone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados incompletos para o agendamento' 
      });
    }

    // Verifica disponibilidade antes de agendar
    const availability = await availabilityController.getAvailability(userId, date);
    
    if (!availability.success) {
      return res.status(400).json(availability);
    }

    // Verifica se o horário e funcionário estão disponíveis
    const timeAvailable = availability.availableTimes.includes(time);
    const employeeAvailable = availability.availabilityByTime[time]?.some(
      emp => emp.key === employeeId
    );

    if (!timeAvailable || !employeeAvailable) {
      return res.status(400).json({ 
        success: false, 
        error: 'Horário ou funcionário não disponível' 
      });
    }

    // Cria ID único para o agendamento
    const appointmentId = `agend_${Date.now()}`;
    
    // Dados do agendamento
    const appointmentData = {
      date,
      time,
      employeeId,
      clientName,
      clientPhone,
      service,
      status: 'confirmado',
      createdAt: new Date().toISOString()
    };

    // Salva no Firebase
    await set(
      ref(db, `${userId}/agendamentos/${appointmentId}`),
      appointmentData
    );

    res.status(201).json({
      success: true,
      appointmentId,
      message: 'Agendamento criado com sucesso',
      data: appointmentData
    });

  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao criar agendamento' 
    });
  }
});

/**
 * @route GET /api/appointments
 * @description Lista agendamentos por data ou todos
 * @param {string} [date] - Data no formato dd/mm (opcional)
 * @returns {Object} - Lista de agendamentos
 */
router.get('/appointments', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || '';
    const { date } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    // Busca todos os agendamentos do usuário
    const snapshot = await get(ref(db, `usuarios/${userId}/agendamentos`));
    let appointments = Object.entries(snapshot.val() || {}).map(
      ([id, data]) => ({ id, ...data })
    );

    // Filtra por data se fornecida
    if (date) {
      appointments = appointments.filter(appt => appt.date === date);
    }

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });

  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar agendamentos' 
    });
  }
});

export default router;