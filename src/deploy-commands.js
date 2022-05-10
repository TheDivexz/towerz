// Deploys and registers all the commands for the bot
const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientID, guildID, botToken } = require('../config.json');
const path = require('node:path');

// Gets list of all the commands
const commands = [];
const commandFiles = fs.readdirSync(path.resolve(__dirname, './commands')).filter(file => file.endsWith('.js'));

// Adds all the commands to the commands array
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

// Registers all the commands to the guild
const rest = new REST({ version: '9' }).setToken(botToken);

rest.put(Routes.applicationGuildCommands(clientID, guildID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);