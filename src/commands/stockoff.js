const { SlashCommandBuilder } = require('@discordjs/builders');

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
		.addIntegerOption((option) =>
			option.setName('days')
				.setDescription('How many days will the game last?')
				.setRequired(true),
		),
	async execute(interaction) {
		await interaction.reply(`Let the Stock off begin with $${interaction.options.getInteger('dollars')} for ${interaction.options.getInteger('days')} days`);
	},
};