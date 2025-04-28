/**
 * Gera horários entre start e end com intervalo de 30 minutos
 * @param {string} start - Hora inicial (HH:mm)
 * @param {string} end - Hora final (HH:mm)
 * @returns {string[]} - Array de horários
 */
export function generateTimeSlots(start, end, interval = 30) {
    const slots = [];
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      slots.push(
        `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      );
      
      currentMinute += interval;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    
    return slots;
  }
  
  /**
   * Verifica se a data é dia útil
   * @param {string} dateStr - Data no formato dd/mm
   * @param {string[]} weekdays - Dias úteis (ex: ['segunda', 'terça'])
   * @returns {boolean}
   */
  export function isWeekdayIncluded(dateStr, weekdays) {
    const [day, month] = dateStr.split('/');
    const date = new Date();
    date.setMonth(parseInt(month) - 1);
    date.setDate(parseInt(day));
    
    const daysMap = {
      'domingo': 0, 'segunda': 1, 'terça': 2, 
      'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6
    };
    
    const dayOfWeek = date.getDay();
    return weekdays.some(day => daysMap[day.toLowerCase()] === dayOfWeek);
  }