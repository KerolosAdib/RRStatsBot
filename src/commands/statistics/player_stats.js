const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    global: true,
    category: 'statistics',
    data: new SlashCommandBuilder()
        .setName('player_stats')
        .setDescription('Retrieve players stats')
        .addStringOption((option) =>
            option
                .setName('player')
                .setDescription('The players gamertag')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};
