const { getContextParam } = require('../utils/contextUtils');
const transactionHistory = require('./transactionHistory');
const portfolioValuation = require('./portfolioValuation');
const exploreFunds = require('./exploreFunds');
const investInFund = require('./investInFund');

module.exports = function getMobileNumber(agent) {
  const mobile = agent.parameters['mobile']?.replace(/\D/g, '');

  if (!/^\d{10}$/.test(mobile)) {
    agent.add("That doesn't look like a valid mobile number. Please enter a 10-digit number.");
    return;
  }

  agent.context.set({
    name: 'got_mobile',
    lifespan: 5,
    parameters: { mobile }
  });

  const askContext = agent.context.get('ask_mobile');
  const intentToResume = askContext?.parameters?.resume_intent;

  if (intentToResume === 'TransactionHistory' && askContext.parameters['date-period']) {
    agent.parameters['date-period'] = askContext.parameters['date-period'];
    return transactionHistory(agent);
  }

  if (intentToResume === 'PortfolioEvalution') {
    return portfolioValuation(agent);
  }

  if (intentToResume === 'ExploreFunds') {
    agent.parameters['fund-category'] = askContext.parameters.fund_category;
    return exploreFunds(agent);
  }

  if (intentToResume === 'InvestInMutualFund') {
    agent.parameters['fund-name'] = askContext.parameters['fund-name'];
    agent.parameters['amount'] = askContext.parameters['amount'];
    return investInFund(agent);
  }

  agent.add(`Thanks! I've saved your number: ${mobile}. How can I help you next?`);
};
