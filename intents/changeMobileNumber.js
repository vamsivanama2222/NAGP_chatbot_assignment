module.exports = function changeMobileNumber(agent) {
    agent.context.set({ name: 'got_mobile', lifespan: 0 });
    agent.context.set({ name: 'ask_mobile_number', lifespan: 2 });
    agent.add("Sure, please provide your new mobile number.");
  };
  