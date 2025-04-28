import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { generateTimeSlots, isWeekdayIncluded } from '../utils/timeUtils';

export class AvailabilityController {
  constructor(db) {
    this.db = db;
  }

  async getAvailability(userId, selectedDate) {
    try {
      const [configSnapshot, appsSnapshot, empsSnapshot] = await Promise.all([
        get(ref(this.db, `usuarios/${userId}/config`)),
        get(query(
          ref(this.db, `usuarios/${userId}/agendamentos`),
          orderByChild('date'),
          equalTo(selectedDate)
        )),
        get(ref(this.db, `usuarios/${userId}/funcionarios`))
      ]);

      const config = configSnapshot.val() || {};
      const appointments = appsSnapshot.val() || {};
      const employees = empsSnapshot.val() || {};

      // Verifica se é dia de trabalho
      if (!isWeekdayIncluded(selectedDate, config.businessDays || [])) {
        return {
          success: true,
          availableTimes: [],
          availabilityByTime: {},
          message: "Dia não é dia de trabalho"
        };
      }

      // Gera horários automaticamente
      const timeSlots = generateTimeSlots(
        config.businessHours.start, 
        config.businessHours.end
      );

      // Filtra disponibilidade
      const result = this.calculateAvailability(
        timeSlots,
        Object.values(appointments),
        employees
      );

      return {
        success: true,
        date: selectedDate,
        ...result
      };

    } catch (error) {
      console.error('Erro no getAvailability:', error);
      return {
        success: false,
        error: 'Erro ao buscar disponibilidade'
      };
    }
  }

  calculateAvailability(timeSlots, dailyAppointments, employees) {
    const availableTimes = [];
    const availabilityByTime = {};

    timeSlots.forEach(time => {
      const availableEmployees = Object.keys(employees).filter(empId => {
        // Verifica se não existe agendamento para este funcionário no horário
        return !dailyAppointments.some(appt => 
          appt.time === time && appt.employeeId === empId
        );
      });

      if (availableEmployees.length > 0) {
        availableTimes.push(time);
        availabilityByTime[time] = availableEmployees.map(empId => ({
          id: empId,
          ...employees[empId]
        }));
      }
    });

    return { availableTimes, availabilityByTime };
  }
}