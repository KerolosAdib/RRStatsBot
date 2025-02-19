const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { commands, events } = require('./modules');

require('dotenv').config();

const token = process.env.BOT_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

for (const key in commands) {
    client.commands.set(commands[key].data.name, commands[key]);
}

for (const key in events) {
    const event = events[key];

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(token);
