const { SlashCommandBuilder } = require('@discordjs/builders');
const { Modal, TextInputComponent, showModal } = require('discord-modals');
const { MessageActionRow } = require('discord.js');
const { MessageSelectMenu } = require('discord.js');
const { MessageButton } = require('discord.js');
const { MessageEmbed } = require('discord.js');
const request = require('request');
const { alphavantage_api } = require('../../config.json');
const StockOffGames = require('../schemas/StockOffGamesSchema');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('stockinfo')
		.setDescription('Gets the information about a stock')
		.addStringOption((option) =>
			option.setName('symbol')
				.setDescription('the symbol of the stock ie. GME')
				.setRequired(true),
		),
	async execute(interaction, client) {
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

				const embed = new MessageEmbed()
					.setColor('#fcba03')
					.setTitle(`The Value of $${interaction.options.getString('symbol')} is $${latest_value}`)
					.setURL(`https://finance.yahoo.com/quote/${interaction.options.getString('symbol')}/`);

				// Option to Buy or Sell
				const row = new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setCustomId('buy')
							.setLabel('BUY 🐂')
							.setStyle('SUCCESS'),
						new MessageButton()
							.setCustomId('sell')
							.setLabel('SELL 🐻')
							.setStyle('DANGER'),
					);

				interaction.reply({
					embeds: [embed],
					components: [row],
				});

				let interactor = 'PLACEHOLDER';

				const filter = i => {
					interactor = i.user.id;
					return true;
				};

				const collector = interaction.channel.createMessageComponentCollector({
					filter,
				});

				collector.on('collect', async (ButtonInteraction) => {

					const buttonid = ButtonInteraction.customId;
					const list_of_games = [];

					StockOffGames.find({ 'players.playerid': interactor }, function(err, docs) {
						if (err) {
							console.log(err);
						}
						else {
							for (const iterator of docs) {
								list_of_games.push({
									label: iterator['gameName'],
									description: `${buttonid} for ${iterator['gameName']}`,
									value: `${iterator['_id']}`,
								});
							}
							const modal = new Modal()
								.setCustomId('buysellamount')
								.setTitle(`How much to ${buttonid}?`)
								.addComponents(
									new TextInputComponent()
										.setCustomId('purchacesellamount')
										.setLabel(`Amount to ${buttonid}`)
										.setStyle('SHORT')
										.setMinLength(1)
										.setPlaceholder('0')
										.setRequired(true),
									new MessageSelectMenu()
										.setCustomId('select')
										.setPlaceholder('Nothing Selected')
										.addOptions(list_of_games),
								);
							showModal(modal, {
								client: client,
								interaction: ButtonInteraction,
							});
						}
					});
				});
			}
		});
	},
};