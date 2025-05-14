exports.getMobileFromContext = (agent) =>
    agent.context.get('got_mobile')?.parameters?.mobile?.replace(/\D/g, '');
  