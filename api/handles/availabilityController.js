import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { generateTimeSlots, isWeekdayIncluded } from '../utils/timeUtils';

export class AvailabilityController {
  constructor(db) {
    this.db = db;
  }

  /**
   * Obtém disponibilidade para uma data específica
   * @param {string} userId - ID do usuário
   * @param {string} date - Data no formato dd/mm
   * @returns {Promise<Object>} - Resposta no formato especificado
   */
  async getAvailability(userId, date) {
    try {
      // Validação da data
      if (!date || !date.match(/^\d{2}\/\d{2}$/)) {
        throw new Error('Formato de data inválido. Use dd/mm');
      }

      // Busca paralela dos dados necessários
      const [config, appointments, employees] = await Promise.all([
        this.getUserConfig(userId),
        this.getDailyAppointments(userId, date),
        this.getAllEmployees(userId)
      ]);

      // Verifica se é dia útil
      if (!isWeekdayIncluded(date, config.businessDays || [])) {
        return this.formatResponse(date, [], {}, employees);
      }

      // Gera horários disponíveis
      const timeSlots = generateTimeSlots(config.businessHours.start, config.businessHours.end);
      const availability = this.calculateAvailability(timeSlots, appointments, employees);

      return this.formatResponse(date, availability.availableTimes, availability.availabilityByTime, employees);

    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar disponibilidade'
      };
    }
  }

  // Métodos auxiliares

  async getUserConfig(userId) {
    const snapshot = await get(ref(this.db, `${userId}/config`));
    return snapshot.val() || {};
  }

  async getDailyAppointments(userId, date) {
    const snapshot = await get(query(
      ref(this.db, `${userId}/agendamentos`),
      orderByChild('date'),
      equalTo(date)
    ));
    return Object.values(snapshot.val() || {});
  }

  async getAllEmployees(userId) {
    const snapshot = await get(ref(this.db, `${userId}/funcionarios`));
    return snapshot.val() || {};
  }

  calculateAvailability(timeSlots, appointments, employees) {
    const result = {
      availableTimes: [],
      availabilityByTime: {}
    };

    timeSlots.forEach(time => {
      const availableEmployees = this.getAvailableEmployees(time, appointments, employees);
      
      if (availableEmployees.length > 0) {
        result.availableTimes.push(time);
        result.availabilityByTime[time] = availableEmployees;
      }
    });

    return result;
  }

  getAvailableEmployees(time, appointments, employees) {
    return Object.entries(employees)
      .filter(([empId]) => !this.isEmployeeBooked(empId, time, appointments))
      .map(([key, { nome, cargo }]) => ({ key, nome, cargo }));
  }

  isEmployeeBooked(employeeId, time, appointments) {
    return appointments.some(appt => 
      appt.time === time && appt.employeeId === employeeId
    );
  }

  formatResponse(date, availableTimes, availabilityByTime, allEmployees) {
    return {
      success: true,
      date,
      availableTimes,
      availabilityByTime,
      allEmployees: Object.entries(allEmployees).map(([key, { nome, cargo }]) => ({ key, nome, cargo }))
    };
  }
}