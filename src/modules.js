module.exports = {
    commands: require('./commands/modules').commands,
    events: [require('./events/ready'), require('./events/interactionCreate')],
};
