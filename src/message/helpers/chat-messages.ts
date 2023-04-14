function getHelpMessage(): string {
  return `
    🤖 Olá! Sou o Digi, o seu assistente virtual. Aqui estão as funcionalidades disponíveis:
    
    💬 Conversação: Você pode conversar comigo e me perguntar qualquer coisa. Basta me enviar uma mensagem!
        
    🎨 Geração de imagens: Gere imagens incríveis usando o comando /imagine e fornecendo um prompt.

    👨‍🔧 Suporte técnico: Precisando de suporte para usar o bot? Utilize o /suporte
    
    🗑 Limpeza de histórico: Para limpar o histórico de mensagens, é só usar o comando /clear
        
    👋 Se precisar de ajuda em algum momento, é só chamar! Estou aqui para ajudar. `;
}

function getDonationMessage(): string {
  return `
    🤖 Bem-vindo(a) ao Digi! Estou aqui para ajudar no seu dia a dia e responder suas perguntas! 

    🙌 Se você quiser nos apoiar e contribuir para manter e melhorar o projeto, considere fazer uma doação e faça parte da nossa missão de tornar IA's acessíveis para todos:

    🙏 Basta enviar a mensagem doar ou /doar. 
    
    🚀 Sua contribuição fará uma grande diferença para a comunidade. Obrigado pela sua generosidade! 😊
  
    E agora, como posso te ajudar? `;
}

function getThankYouMessage(): string {
  return `
    🥳🥳 Muito obrigado 🥳🥳

    PIX: tasso@digitalsociety.me

    Sua contribuição é essencial para manter nosso projeto!

    🤖 Diga-me, como posso ajudar agora? `;
}

function getClearChatSuccessMessage(): string {
  return `Histórico limpo com sucesso, como posso te ajudar hoje? 🤖`;
}

function getHelperSuporterMessage(): string {
  return `Para suporte humanizado, entre em contato através do seguinte número durante o horário comercial:

  📞 +55 21 96481 - 6991 - Falar com Tasso

  Por favor, observe que o suporte está disponível somente durante o horário comercial. `;
}

export {
  getDonationMessage,
  getHelpMessage,
  getThankYouMessage,
  getClearChatSuccessMessage,
  getHelperSuporterMessage,
};
