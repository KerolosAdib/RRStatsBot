const { REST, Routes } = require('discord.js');

require('dotenv').config();

const { commands } = require('./modules');

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
    rest.put(
        Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
        ),
        { body: [] }
    )
        .then(() => console.log('Successfully deleted all guild commands.'))
        .catch(console.error);

    rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
        .then(() =>
            console.log('Successfully deleted all application commands.')
        )
        .catch(console.error);

    const globalCommands = [];
    const guildCommands = [];
    for (const key in commands) {
        if (commands[key].global) globalCommands.push(commands[key]);
        else guildCommands.push(commands[key]);
    }
    const globalCommandsJSON = globalCommands.map((command) =>
        command.data.toJSON()
    );
    const guildCommandsJSON = guildCommands.map((command) =>
        command.data.toJSON()
    );

    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
            body: globalCommandsJSON,
        });

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: guildCommandsJSON,
            }
        );
    } catch (err) {
        console.error(err);
    }
})();
