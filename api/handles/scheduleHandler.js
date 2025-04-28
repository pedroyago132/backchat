const SessionService = require('../services/sessionService');
const ZApiService = require('../services/zapiService');
const { database } = require('../firebase');

async function scheduleHandler(phone, message, session) {
  if (message === 'agendar' || message === 'schedule') {
    await ZApiService.sendText(phone, 'Por favor, digite a data desejada para o agendamento (DD/MM/AAAA):');
    await SessionService.updateStep(phone, 'getting_date');
  } else if (session.currentStep === 'getting_date') {
    if (isValidDate(message)) {
      // Verificar agendamentos existentes para esta data
      const bookedTimes = await getBookedTimes(message);
      
      await SessionService.createOrUpdateSession(phone, {
        currentStep: 'getting_time',
        data: {
          ...session.data,
          date: message,
          bookedTimes: bookedTimes // Armazenar horários ocupados na sessão
        }
      });
      
      // Mostrar apenas horários disponíveis
      await showAvailableTimes(phone, bookedTimes);
    } else {
      await ZApiService.sendText(phone, 'Data inválida. Por favor, digite no formato DD/MM/AAAA:');
    }
  } else if (session.currentStep === 'getting_time') {
    if (isValidTime(message)) {
      // Verificar se o horário ainda está disponível
      const isAvailable = await checkTimeAvailability(session.data.date, message);
      
      if (isAvailable) {
        await SessionService.createOrUpdateSession(phone, {
          currentStep: 'confirmation',
          data: {
            ...session.data,
            time: message
          }
        });
        
        await ZApiService.sendButtons(phone, 
          `Confirma o agendamento para ${session.data.date} às ${message}?`, [
          { id: 'confirm', text: 'Confirmar' },
          { id: 'change', text: 'Alterar' }
        ]);
      } else {
        await ZApiService.sendText(phone, 'Este horário já foi reservado. Por favor, escolha outro:');
        await showAvailableTimes(phone, session.data.bookedTimes);
      }
    } else {
      await ZApiService.sendText(phone, 'Horário inválido. Por favor, escolha um dos horários disponíveis.');
      await showAvailableTimes(phone, session.data.bookedTimes);
    }
  } else if (session.currentStep === 'confirmation' && message === 'confirm') {
    // Finalizar agendamento
    await ZApiService.sendText(phone, 
      `Agendamento confirmado, ${session.data.name}! Você está marcado para ${session.data.date} às ${session.data.time}.`);
    
    // Salvar o agendamento no Realtime Database
    await saveAppointment(session);
    
    // Limpar sessão
    await SessionService.clearSession(phone);
  } else {
    await ZApiService.sendText(phone, 'Vamos voltar ao início.');
    await SessionService.clearSession(phone);
    await startHandler(phone, '', { phone, currentStep: 'start', data: {} });
  }
}

// Função para obter horários já agendados para uma data específica
async function getBookedTimes(date) {
  try {
    const snapshot = await database.ref('appointments')
      .orderByChild('date')
      .equalTo(date)
      .once('value');
    
    const appointments = snapshot.val() || {};
    return Object.values(appointments).map(app => app.time);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }
}

// Função para verificar disponibilidade de um horário específico
async function checkTimeAvailability(date, time) {
  try {
    const snapshot = await database.ref('appointments')
      .orderByChild('date')
      .equalTo(date)
      .once('value');
    
    const appointments = snapshot.val() || {};
    
    return !Object.values(appointments).some(app => app.time === time);
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return false;
  }
}

// Função para mostrar horários disponíveis ao usuário
async function showAvailableTimes(phone, bookedTimes) {
  const allTimes = ['08:00', '10:00', '14:00', '16:00'];
  const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));
  
  if (availableTimes.length === 0) {
    await ZApiService.sendText(phone, 'Infelizmente não há horários disponíveis para esta data. Por favor, escolha outra data.');
    await SessionService.updateStep(phone, 'getting_date');
  } else {
    const buttons = availableTimes.map(time => ({
      id: time,
      text: time
    }));
    
    await ZApiService.sendButtons(phone, 'Horários disponíveis:', buttons);
  }
}

function isValidDate(dateString) {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  return regex.test(dateString);
}

function isValidTime(timeString) {
  const regex = /^\d{2}:\d{2}$/;
  return regex.test(timeString);
}

async function saveAppointment(session) {
  try {
    const appointmentsRef = database.ref('appointments');
    const newAppointmentRef = appointmentsRef.push();
    
    await newAppointmentRef.set({
      clientName: session.data.name,
      clientPhone: session.phone,
      date: session.data.date,
      time: session.data.time,
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    });
    
    console.log('Agendamento salvo com ID:', newAppointmentRef.key);
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    throw error;
  }
}

module.exports = { scheduleHandler };