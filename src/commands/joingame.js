const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const StockOffGames = require('../schemas/StockOffGamesSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('joingame')
		.setDescription('join an existing game'),

	async execute(interaction) {

		StockOffGames.find({ 'isOngoing': true }, function(err, docs) {
			const list_of_games = [];
			if (err) {
				return console.log(err);
			}
			for (const iterator of docs) {
				list_of_games.push({
					label: iterator['gameName'],
					description: `check portfolio for ${iterator['gameName']}`,
					value: `${iterator['_id']}`,
				});
			}
			const gamesrow = new MessageActionRow()
				.addComponents(
					new MessageSelectMenu()
						.setCustomId('select')
						.setPlaceholder('nothing selected')
						.addOptions(list_of_games),
				);

			interaction.reply({
				content: 'Which game would you like to join?',
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
					for (let i = 0; i < docs2.players.length; i++) {
						if (docs2.players[i]['isStillPlaying'] === true && docs2.players[i]['playerid'] === interactor) {
							return MenuInteraction.reply({
								content: 'You are already part of the game',
								ephemeral: true,
							});
						}
						else if (docs2.players[i]['isStillPlaying'] === false && docs2.players[i]['playerid'] === interactor) {
							docs2.players[i]['isStillPlaying'] = true;
							docs2.save();
							return MenuInteraction.reply({
								content: 'game joined!',
								ephemeral: true,
							});
						}
					}
					docs2.players.push({
						playerid: interactor,
						currentValue: docs2['startingCash'],
						isStillPlaying: true,
					});
					docs2.save();
					return MenuInteraction.reply({
						content: 'game joined!',
						ephemeral: true,
					});
				});
			});
		});
	},
};