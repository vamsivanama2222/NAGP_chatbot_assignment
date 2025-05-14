const fs = require('fs');
const path = require('path');

module.exports = function getFundDetails(agent) {
  const fundName = agent.parameters['fund-name'];
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../fund_details.json')));
  const fund = data.find(f => f.fund_name.toLowerCase() === fundName?.toLowerCase());

  if (!fund) {
    agent.add(`No details found for fund: ${fundName}`);
    return;
  }

  let response = `📊 *${fund.fund_name}* Breakdown:\n`;
  for (const [k, v] of Object.entries(fund.breakdown)) {
    response += `• ${k}: ${v}%\n`;
  }
  response += `\n🔗 More info: ${fund.details_link}`;
  agent.add(response);
};
