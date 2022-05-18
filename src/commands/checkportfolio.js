const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const StockOffGames = require('../schemas/StockOffGamesSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('checkportfolio')
		.setDescription('Check your current investment portfolio'),

	async execute(interaction) {

		StockOffGames.find({ 'players.playerid': interaction.user.id }, function(err, docs) {
			const list_of_games = [];
			if (err) {
				return console.log(err);
			}
			for (const iterator of docs) {
				if (iterator['isOngoing']) {
					list_of_games.push({
						label: iterator['gameName'],
						description: `check portfolio for ${iterator['gameName']}`,
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
				content: 'Which game would you like to check your portfolio?',
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
				let portfolio = `${interaction.user.tag}'s portfolio`;
				StockOffGames.findById(value, function(err, docs2) {
					for (let i = 0; i < docs2.players.length; i++) {
						if (docs2.players[i]['playerid'] === interactor) {
							for (let j = 0; j < docs2.players[i]['stocks'].length; j++) {
								portfolio += '\n';
								portfolio += docs2.players[i]['stocks'][j]['code'];
								portfolio += '\t';
								portfolio += docs2.players[i]['stocks'][j]['amountheld'];
							}
							break;
						}
					}
					return MenuInteraction.reply({ content: portfolio });
				});
			});
		});
	},
};