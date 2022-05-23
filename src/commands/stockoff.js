const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { MessageButton } = require('discord.js');
const { MessageActionRow } = require('discord.js');
const StockOffGames = require('../schemas/StockOffGamesSchema');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stockoff')
		.setDescription('Initiate a stock off game')
		// How Much Money does everyone start with?
		.addIntegerOption((option) =>
			option.setName('dollars')
				.setDescription('How much money does everyone start with')
				.setRequired(true),
		)
		// How Long Does the Game Last?
		.addIntegerOption((option) =>
			option.setName('days')
				.setDescription('How many days will the game last?')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option.setName('name')
				.setDescription('What would you like to name the game?')
				.setRequired(true),
		),
	async execute(interaction) {

		const enddate = new Date();
		enddate.setDate(enddate.getDate() + interaction.options.getInteger('days'));

		// Creates a new Entry in MongoDB saying there is a new Game
		const newGame = await StockOffGames.create({
			gameName: interaction.options.getString('name'),
			host: interaction.user.id,
			endDate: enddate,
			startingCash: interaction.options.getInteger('dollars'),
			isOngoing: true,
		});
		newGame.players.push({
			playerid: interaction.user.id,
			currentValue: interaction.options.getInteger('dollars'),
		});
		await newGame.save();

		// Creates 2 buttons, Join and Leave Game
		const row = new MessageActionRow()
			.addComponents(
				// Join Button
				new MessageButton()
					.setCustomId('join')
					.setLabel('Join Game')
					.setStyle('SUCCESS'),
				// Leave Button
				new MessageButton()
					.setCustomId('leave')
					.setLabel('Leave Game')
					.setStyle('DANGER'),
			);

		// Shows the game information
		const embed = new MessageEmbed()
			.setColor('#32a852')
			.setTitle(`${interaction.options.getString('name')}`)
			.addFields(
				{
					name: 'Starting Amount',
					value: `$${interaction.options.getInteger('dollars')}`,
					inline: true,
				},
				{
					name: 'Days',
					value: `${interaction.options.getInteger('days')}`,
					inline: true,
				},
			);

		// Displays the game infromation and buttons
		await interaction.reply({
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

		// Says what all the buttons do
		collector.on('collect', async (ButtonInteraction) => {
			const id = ButtonInteraction.customId;

			if (id === 'join') {
				// Adds Player to the game
				for (let i = 0; i < newGame.players.length; i++) {
					if (newGame.players[i]['playerid'] === interactor) {
						if (newGame.players[i]['isStillPlaying'] === true) {
							return await ButtonInteraction.reply({
								content: 'You are already part of the game',
								ephemeral: true,
							});
						}
						else {
							newGame.players[i]['isStillPlaying'] = true;
							await newGame.save();
							return await ButtonInteraction.reply({
								content: 'game joined!',
								ephemeral: true,
							});
						}
					}
				}
				newGame.players.push({
					playerid: interactor,
					currentValue: interaction.options.getInteger('dollars'),
					isStillPlaying: true,
				});
				// Lets them know they've joined the game
				await newGame.save();
				return await ButtonInteraction.reply({
					content: 'game joined!',
					ephemeral: true,
				});
			}
			if (id === 'leave') {
				// says they are no longer playing
				// Doesn't delete straight from database otherwise if you down money
				// you can leave and rejoing with the starting money
				for (let i = 0; i < newGame.players.length; i++) {
					if (newGame.players[i]['playerid'] === interactor && newGame.players[i]['isStillPlaying'] === true) {
						newGame.players[i]['isStillPlaying'] = false;
						await newGame.save();
						return await ButtonInteraction.reply({
							content: 'game left!',
							ephemeral: true,
						});
					}
				}
				return await ButtonInteraction.reply({
					content: 'You already left the game!',
					ephemeral: true,
				});
			}
		});
	},
};