// appointmentsController.js
import { generateWorkHours } from './dateUtils';
import { authenticateUser } from './authMiddleware';
import { db, ref, get, set } from './firebaseConfig';

// Middleware para todas as rotas de agendamento
export const appointmentRoutes = (router) => {
  router.use(authenticateUser);

  // Verificar disponibilidade
  router.get('/availability', async (req, res) => {
    const { date } = req.query;
    const { userId } = req;

    if (!date || !date.match(/^\d{2}\/\d{2}$/)) {
      return res.status(400).json({ error: 'Formato inválido. Use dd/mm' });
    }

    try {
      const firebaseDate = formatToFirebaseKey(date);
      const weekday = getWeekday(date);
      
      const [configSnapshot, appsSnapshot, empsSnapshot] = await Promise.all([
        get(ref(db, `${userId}/config/businessHours`)),
        get(ref(db, `${userId}/agendamentos/${firebaseDate}`)),
        get(ref(db, `${userId}/funcionarios`))
      ]);

      const businessHours = configSnapshot?.val();
      const appointments = appsSnapshot?.val() || {};
      const employees = empsSnapshot.val() || {};

      const workHours = generateWorkHours(businessHours.start, businessHours.end);

      const availableSlots = workHours.filter(time => {
        return Object.keys(employees).some(empId => {
          const emp = employees[empId];
          return emp.workDays.includes(weekday) && 
                !Object.values(appointments).some(a => a.employeeId === empId && a.time === time);
        });
      });

      res.json({
        date,
        availableSlots,
        employees: Object.values(employees)
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Criar agendamento
  router.post('/', async (req, res) => {
    const { date, time, employeeId, clientName, clientPhone, service } = req.body;
    const { userId } = req;

    if (!date || !date.match(/^\d{2}\/\d{2}$/)) {
      return res.status(400).json({ error: 'Formato inválido. Use dd/mm' });
    }

    try {
      const firebaseDate = formatToFirebaseKey(date);
      const existingRef = ref(db, `usuarios/${userId}/appointments/${firebaseDate}/${time}`);
      const existingSnapshot = await get(existingRef);

      if (existingSnapshot.exists()) {
        return res.status(400).json({ error: 'Horário já agendado' });
      }

      await set(existingRef, {
        employeeId,
        clientName,
        clientPhone,
        service,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Listar agendamentos
  router.get('/', async (req, res) => {
    const { date } = req.query;
    const { userId } = req;

    if (!date || !date.match(/^\d{2}\/\d{2}$/)) {
      return res.status(400).json({ error: 'Formato inválido. Use dd/mm' });
    }

    try {
      const firebaseDate = formatToFirebaseKey(date);
      const snapshot = await get(ref(db, `usuarios/${userId}/appointments/${firebaseDate}`));
      const appointments = snapshot.val() || {};

      const result = Object.entries(appointments).map(([time, details]) => ({
        date,
        time,
        ...details
      }));

      res.json(result);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};