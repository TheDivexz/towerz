const { SlashCommandBuilder } = require('@discordjs/builders');

// Basic template of how to do a command
module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};