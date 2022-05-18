const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const request = require('request');
const { alphavantage_api } = require('../../config.json');
const StockOffGames = require('../schemas/StockOffGamesSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('buystock')
		.setDescription('BUY BUY BUY 💎🤲📈🚀🌙')
		.addStringOption((option) =>
			option.setName('symbol')
				.setDescription('the symbol of the stock ie. GME')
				.setRequired(true),
		)
		.addIntegerOption((option) =>
			option.setName('amount')
				.setDescription('How many of those stocks would you like to buy?')
				.setRequired(true),
		),

	async execute(interaction) {
		const api_call = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${interaction.options.getString('symbol')}&interval=5min&apikey=${alphavantage_api}`;
		let latest_value = '';

		if (interaction.options.getInteger('amount') < 0) {
			return interaction.reply({ content: 'this fucking dumbass tried to buy a negative amount of stocks' });
		}

		request.get({
			url: api_call,
			json: true,
			headers: { 'User-Agent': 'request' },
		}, (err, res, data) => {
			if (err) {
				console.log('Error:', err);
				return interaction.reply('yell at Dhruv to check the logs');
			}
			if (res.statusCode !== 200) {
				console.log('Status:', res.statusCode);
				return interaction.reply('yell at Dhruv to check the logs');
			}
			// data is successfully parsed as a JSON object:
			const latest_timestamp = data['Meta Data']['3. Last Refreshed'];
			latest_value = data['Time Series (5min)'][latest_timestamp]['4. close'];
			const list_of_games = [];
			// Get the list of games the player
			StockOffGames.find({ 'players.playerid': interaction.user.id }, function(err, docs) {
				if (err) {
					return console.log(err);
				}
				for (const iterator of docs) {
					if (iterator['isOngoing']) {
						list_of_games.push({
							label: iterator['gameName'],
							description: `buy/sell for ${iterator['gameName']}`,
							value: `${iterator['_id']}`,
						});
					}
				}
				const gamesrow = new MessageActionRow()
					.addComponents(
						new MessageSelectMenu()
							.setCustomId('select')
							.setPlaceholder('nothing selected')
							.addOptions(list_of_games),
					);

				interaction.reply({
					content: 'Which game would you like to buy it for?',
					components: [gamesrow],
					ephemeral: true,
				});

				let interactor = 'PLACEHOLDER';

				const filter = i => {
					interactor = i.user.id;
					return true;
				};

				const collector = interaction.channel.createMessageComponentCollector({
					filter,
					max: '1',
				});

				collector.on('collect', async (MenuInteraction) => {

					const value = MenuInteraction.values[0];
					StockOffGames.findById(value, function(err, docs2) {
						if (err) {
							console.log('Error:', err);
							return interaction.reply('yell at Dhruv to check the logs');
						}
						let playercash = 'PLACEHOLDER';
						for (const iterator of docs2['players']) {
							if (iterator['playerid'] === interactor) {
								playercash = iterator['currentValue'].toString();
								break;
							}
						}

						const totalcost = interaction.options.getInteger('amount') * parseFloat(latest_value);

						if (totalcost < parseFloat(playercash)) {
							playercash = parseFloat(playercash) - totalcost;
							// Find the player's info
							for (let i = 0; i < docs2.players.length; i++) {
								let doeshavestockalready = false;
								// Add to their stock purchace
								if (docs2.players[i]['playerid'] === interactor) {
									docs2.players[i]['currentValue'] -= totalcost;
									for (let j = 0; docs2.players[i]['stocks'].length; j++) {
										if (docs2.players[i]['stocks'][j]['code'] === interaction.options.getString('symbol')) {
											docs2.players[i]['stocks'][j]['amountheld'] += interaction.options.getInteger('amount');
											doeshavestockalready = true;
											break;
										}
									}
									if (!doeshavestockalready) {
										docs2.players[i]['stocks'].push({
											code: interaction.options.getString('symbol'),
											amountheld: interaction.options.getInteger('amount'),
										});
									}
									break;
								}
							}
							MenuInteraction.reply({
								content: `${interaction.user.tag} has purchased ${interaction.options.getInteger('amount')} of ${interaction.options.getString('symbol')} for $${totalcost}`,
							});
						}
						else {
							MenuInteraction.reply({
								content: 'This person tried to buy more stocks than they can afford',
							});
						}
						docs2.save();
					});
				});
			});
		});
	},
};