const fs = require('fs');
const path = require('path');
const { getMobileFromContext } = require('../utils/contextUtils');

module.exports = function exploreFunds(agent) {
  const category = agent.parameters['fund-category']?.toLowerCase();
  const userMobile = getMobileFromContext(agent);

  if (!userMobile) {
    agent.context.set({
      name: 'ask_mobile',
      lifespan: 2,
      parameters: {
        resume_intent: 'ExploreFunds',
        fund_category: category
      }
    });
    agent.add("Please share your mobile number before we explore funds.");
    return;
  }

  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../fund&categorysample.json')));
  const match = data.find(f => f.category.toLowerCase() === category);

  if (!match) {
    agent.add(`Sorry, no funds found in "${category}". Try another category.`);
    return;
  }

  let response = `Here are some ${category} funds:\n`;
  match.funds.forEach(f => {
    response += `• ${f.fund_name} (ID: ${f.fund_id})\n`;
  });

  agent.add(response);
  agent.add("Would you like details on any of these, or would you like to invest?");
};
