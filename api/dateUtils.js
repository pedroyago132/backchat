export function formatToFirebaseKey(dateStr) {
    const [day, month] = dateStr.split('/');
    return `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Converte mm-dd de volta para dd/mm
  export function formatToDisplay(firebaseKey) {
    const [month, day] = firebaseKey.split('-');
    return `${day}/${month}`;
  }
  
  // Obtém o dia da semana (segunda, terça, etc.)
  export function getWeekday(dateStr) {
    const [day, month] = dateStr.split('/');
    const currentYear = new Date().getFullYear();
    const date = new Date(`${currentYear}-${month}-${day}`);
    const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return weekdays[date.getDay()];
  }