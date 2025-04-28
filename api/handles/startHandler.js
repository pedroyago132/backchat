const SessionService = require('../services/sessionService');
const ZApiService = require('../services/zapiService');

async function startHandler(phone, message, session) {
  if (message === '' || message === 'iniciar' || message === 'olá' || message === 'oi') {
    await ZApiService.sendText(phone, 'Olá! Bem-vindo ao serviço de agendamento. Qual é o seu nome?');
    await SessionService.updateStep(phone, 'getting_name');
  } else if (session.currentStep === 'getting_name') {
    // Salvar nome e avançar para o próximo passo
    await SessionService.createOrUpdateSession(phone, {
      currentStep: 'main_menu',
      data: {
        name: message
      }
    });
    
    // Enviar menu principal
    await ZApiService.sendButtons(phone, `Ótimo, ${message}! O que você gostaria de fazer?`, [
      { id: 'schedule', text: 'Agendar horário' },
      { id: 'cancel', text: 'Cancelar agendamento' },
      { id: 'info', text: 'Informações' }
    ]);
  } else {
    await ZApiService.sendText(phone, 'Desculpe, não entendi. Por favor, digite "iniciar" para começar.');
  }
}

module.exports = { startHandler };