const { SlashCommandBuilder } = require('@discordjs/builders');
const request = require('request');
const { alphavantage_api } = require('../../config.json');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('stockinfo')
		.setDescription('Gets the information about a stock')
		.addStringOption((option) =>
			option.setName('symbol')
				.setDescription('the symbol of the stock ie. GME')
				.setRequired(true),
		),
	async execute(interaction) {
		const api_call = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${interaction.options.getString('symbol')}&interval=5min&apikey=${alphavantage_api}`;
		let latest_value = '';
		request.get({
			url: api_call,
			json: true,
			headers: { 'User-Agent': 'request' },
		}, (err, res, data) => {
			if (err) {
				console.log('Error:', err);
			}
			else if (res.statusCode !== 200) {
				console.log('Status:', res.statusCode);
			}
			else {
				// data is successfully parsed as a JSON object:
				const latest_timestamp = data['Meta Data']['3. Last Refreshed'];
				latest_value = data['Time Series (5min)'][latest_timestamp]['4. close'];
				interaction.reply({
					content: `The Value of $${interaction.options.getString('symbol')} is $${latest_value}`,
				});
			}
		});
	},
};