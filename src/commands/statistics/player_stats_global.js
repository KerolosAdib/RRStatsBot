const {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder,
} = require('discord.js');
const fs = require('fs');
const Fuse = require('fuse.js');
const { pg } = require('../../pgClient');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

let fuse;

const retrievePlayerNames = async () => {
    const players = [];
    let playerNames;
    const retrievePlayers = 'SELECT GamerTag, PlayerID FROM Players';
    try {
        await pg.connect();
        playerNames = await pg.query(retrievePlayers);
    } catch (err) {
        console.error('Error connecting to PostgreSQL database: ', err);
    }
    const rows = playerNames.rows;
    for (const player in rows) {
        players.push({
            name: rows[player].gamertag,
            id: rows[player].playerid,
        });
    }
    fuse = new Fuse(players, {
        keys: ['name'],
    });
};

const generateAvatarPNG = async (playerID, gamerTag, avatarURL) => {
    let mimeType;
    let url = '';
    if (avatarURL) {
        const res = await fetch(avatarURL);
        if (!res.ok) {
            throw new Error(`Failed to fetch image: ${res.statusText}`);
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        mimeType = res.headers.get('content-type');
        url = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    const svg = generateAvatarSVG(gamerTag, url);
    const resvg = new Resvg(svg);
    const pngBuffer = resvg.render().asPng();
    await fs.promises.writeFile(`./src/photos/${playerID}.png`, pngBuffer);
};

const generateAvatarSVG = (gamerTag, avatarURL) => {
    const firstLetter = gamerTag.charAt(0).toUpperCase();
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
        <defs>
            <clipPath id="avatarClip">
                <circle cx="54" cy="54" r="48"/>
            </clipPath>
        </defs>
        <style>
            .avatar-background {
                fill: rgb(214, 218, 222);
                stroke: rgb(249, 249, 251);
                stroke-width: 1px;
            }
            .initial {
                font-family: Roboto, Helvetica, Arial, sans-serif;
                font-size: 38px;
                fill: rgb(255, 255, 255);
                text-anchor: middle;
                dominant-baseline: central;
            }
        </style>
        <circle class="avatar-background" cx="54" cy="54" r="48" />
        <text class="initial" x="54" y="45" transform="scale(1, 1.2)">${firstLetter}</text>
        <image x="0" y="0" width="108" height="108" href="${avatarURL}" clip-path="url(#avatarClip)" />
        </svg>
    `;
};

retrievePlayerNames();

setInterval(retrievePlayerNames, 60 * 60 * 1000);

module.exports = {
    global: true,
    category: 'statistics',
    data: new SlashCommandBuilder()
        .setName('player_stats_global')
        .setDescription('Retrieve global players stats')
        .addStringOption((option) =>
            option
                .setName('player')
                .setDescription('The players gamertag')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async execute(interaction) {
        const date = new Date(interaction.createdTimestamp);
        const query = fs
            .readFileSync(
                path.resolve(
                    __dirname,
                    '../../sql_files/RetrieveStatsForSpecificPlayer.sql'
                )
            )
            .toString();
        const playerID = interaction.options.getString('player');
        const res = await pg.query(query, [playerID]);
        if (res.rows[0]) {
            let pfp;
            if (res.rows[0].profilepicture) {
                pfp = res.rows[0].profilepicture;
            }
            await generateAvatarPNG(playerID, res.rows[0].gamertag, pfp);
            const rrAttachment = new AttachmentBuilder(
                './src/photos/RRicon.png'
            );
            const avatarAttachment = new AttachmentBuilder(
                `./src/photos/${playerID}.png`
            );
            console.log(res.rows);
            const user = interaction.user;
            const avatarURL = user.displayAvatarURL({
                format: 'png',
                dynamic: true,
                size: 1024,
            });

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `Requested By: ${user.tag}`,
                    iconURL: avatarURL,
                })
                .setTitle(`Global Player Statistics - ${res.rows[0].gamertag}`)
                .setThumbnail(`attachment://${playerID}.png`)
                .addFields(
                    {
                        name: 'Number of Sets Won',
                        value: res.rows[0]['Set Wins'].toString(),
                    },
                    {
                        name: 'Number of Sets Lost',
                        value: res.rows[0]['Set Losses'].toString(),
                    },
                    {
                        name: 'Number of Games Won',
                        value: res.rows[0]['Game Wins'].toString(),
                    },
                    {
                        name: 'Number of Games Lost',
                        value: res.rows[0]['Game Losses'].toString(),
                    },
                    {
                        name: 'Win Percentage Based on Sets',
                        value: res.rows[0]['Win Percentage'].toString(),
                    },
                    {
                        name: 'Number of Events Participated In',
                        value: res.rows[0]['Events Participated In'].toString(),
                    }
                )
                .setFooter({
                    text: `Requested at ${date.toLocaleString()}`,
                    iconURL: 'attachment://RRicon.png',
                });

            interaction.reply({
                embeds: [embed],
                files: [avatarAttachment, rrAttachment],
            });
        } else {
            interaction.reply('That name does not exist within the database');
        }
    },

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let search = focusedOption.value;
        if (search == '') search = 'a';
        const results = fuse.search(search, { limit: 5 });
        console.log(results);
        const items = results.map((result) => result.item);
        await interaction.respond(
            items.map((item) => ({
                name: item.name,
                value: item.id.toString(),
            }))
        );
    },
};
