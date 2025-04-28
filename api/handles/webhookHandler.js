const SessionService = require('../services/sessionService');
const ZApiService = require('../services/zapiService');
const { startHandler } = require('./startHandler');
const { scheduleHandler } = require('./scheduleHandler');

async function handleWebhook(data) {
  // Extrair informações da mensagem
  const phone = data.from.replace('@c.us', '');
  const message = data.body?.toLowerCase()?.trim() || '';
  
  // Obter sessão do usuário
  const session = await SessionService.getSession(phone) || {
    phone,
    currentStep: 'start',
    data: {}
  };

  // Roteamento baseado no passo atual
  switch (session.currentStep) {
    case 'start':
      await startHandler(phone, message, session);
      break;
    case 'schedule':
      await scheduleHandler(phone, message, session);
      break;
    // Adicione mais casos conforme necessário
    default:
      await ZApiService.sendText(phone, 'Desculpe, não entendi. Vamos começar novamente.');
      await SessionService.clearSession(phone);
      await startHandler(phone, '', { phone, currentStep: 'start', data: {} });
  }
}

module.exports = { handleWebhook };