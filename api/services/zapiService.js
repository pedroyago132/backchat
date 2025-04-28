const axios = require('axios');

class ZApiService {
  constructor() {
    this.baseUrl = 'https://api.z-api.io/instances';
    this.token = process.env.Z_API_TOKEN;
    this.instance = process.env.Z_API_INSTANCE;
  }

  async sendText(phone, message) {
    const url = `${this.baseUrl}/${this.instance}/token/${this.token}/send-text`;
    
    try {
      const response = await axios.post(url, {
        phone,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem via Z-API:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendButtons(phone, text, buttons) {
    const url = `${this.baseUrl}/${this.instance}/token/${this.token}/send-buttons`;
    
    try {
      const response = await axios.post(url, {
        phone,
        message: text,
        buttons: {
          buttons
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar botões via Z-API:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new ZApiService();