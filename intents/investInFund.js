const fs = require('fs');
const path = require('path');
const { getMobileFromContext } = require('../utils/contextUtils');

module.exports = function investInFund(agent) {
  const userMobile = getMobileFromContext(agent);
  const amount = agent.parameters['amount'];
  const fundName = Array.isArray(agent.parameters['fund-name'])
    ? agent.parameters['fund-name'][0]
    : agent.parameters['fund-name'];

  const normalizedFund = fundName?.trim()?.toLowerCase();

  if (!userMobile) {
    agent.context.set({
      name: 'ask_mobile_number',
      lifespan: 2,
      parameters: {
        resume_intent: 'InvestInMutualFund',
        'fund-name': fundName,
        'amount': amount
      }
    });
    agent.add("Before we proceed with the investment, please provide your mobile number.");
    return;
  }

  if (!normalizedFund || !amount) {
    agent.add("Please mention both the fund name and the amount you'd like to invest.");
    return;
  }

  if (amount > 50000) {
    agent.add("For demo, investments above ₹50,000 require verification. Contact support.");
    return;
  }

  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../fund_details.json')));
  const matched = data.find(f => f.fund_name.toLowerCase() === normalizedFund);

  if (!matched) {
    agent.add(`Sorry, no fund found with name "${fundName}".`);
    return;
  }

  agent.add(`✅ Successfully simulated an investment of ₹${amount} in ${matched.fund_name}.`);
  agent.add("Would you like to check your portfolio or explore more funds?");
};
