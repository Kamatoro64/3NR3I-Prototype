const Discord = require('discord.js');
const { prefix, token, serverId } = require('./config.json');
const schedule = require('node-schedule');
const firstMessage = require('./first-message');
const roleClaim = require('./role-claim');

const client = new Discord.Client();

// Temporary storage for character data
let data = []

client.once('ready', () => {


	//Character initialisation on bot start up, resets on restart
	// CURRENTLY SET TO EDEN TRAUMA
	client.guilds.cache.get(serverId).members.cache.forEach(member => {
		data.push({
			name: member.user.tag,
			health: 100,
			cover: null
		})
	})
	console.log('Character data initialised: \n', data)

	console.log('Ready!');
})

// Adding a bot command
// 3. Add to bot_commands array to register
// 2. Add case in switch statement
// 1. Add a handler for the command

const bot_commands = ['slap', 'raise', 'cover']

client.on('message', message => {

	// Get bot command
	bot_command = getBotCommand(message)

	// Get caster details
	const caster = message.member;
	const caster_tag = message.member.user.tag;

	// Check if caster is dead, also prevents healers from self raising
	if (message.content.startsWith(`${prefix}`) && data.filter(x => x.name === caster_tag)[0].health === 0) {
		message.channel.send(`Error. Unable to cast ${bot_command} when dead! Ask a healer for a raise`)
		return
	}

	// Handle each bot command
	switch (bot_command) {
		case `${prefix}slap`:
			slapHandler(message)
			console.log('State: \n', data)
			break
		case `${prefix}raise`:
			raiseHandler(message)
			console.log('State: \n', data)
			break
		case `${prefix}cover`:
			coverHandler(message)
			console.log('State: \n', data)
			break
	}
})

client.login(token);


const getBotCommand = (message) => {
	if (message.content.startsWith(`${prefix}`) && bot_commands.map(x => `${prefix}` + x).some(x => x === message.content.split(' ')[0])) { // some returns boolean
		const command = message.content.split(' ')[0]
		return command
	} else {
		console.log(`${message.content.split(' ')[0]} is not a bot command`)
		return
	}
}

const raiseHandler = (message) => {
	const caster = message.member;
	const caster_tag = message.member.user.tag;

	// VERY TRICKY. Understanding on structure required
	if (!(message.member.roles.cache.some(role => role.name === 'Healer'))) {
		// if caster is not a Healer (x have Healer role)
		message.channel.send(`Error. Only Healers are allowed to cast raise`)
		return
	}

	// Get target as first user mentioned
	const target = message.mentions.members.first();

	// Error handler - Invalid Target
	if (typeof target === 'undefined') {
		message.channel.send(`Invalid Target`)
		return
	}

	// Get target tag
	const target_tag = target.user.tag

	// If target health is 0
	if (data.filter(x => x.name === target_tag)[0].health === 0) {
		// Set target health to 100
		data.filter(x => x.name === target_tag)[0].health = 100
		message.channel.send(`${target} has been raised! Target HP restored to 100`)

	} else {

		message.channel.send(`Error. Target is not dead!`)
	}

}

const slapHandler = (message) => {

	// Message user logic
	const caster = message.member;
	const caster_tag = message.member.user.tag;

	switch (caster_tag) {
		/*
		case "Shiro#1326":
			message.channel.send(`Error - Lalafells are not allowed to slap. Please switch race and try again. You may purchase a Fantasia potion at the Mog Station`)
			break;
		*/
		default:
			console.log('No caster specific logic activated')
	}

	// Get target as first user mentioned
	const target = message.mentions.members.first();

	// Error handler - Invalid Target
	if (typeof target === 'undefined') {
		message.channel.send(`Invalid Target`)
		return
	}

	// Get target tag
	const target_tag = target.user.tag

	switch (target_tag) {
		case caster_tag: // Caster attempts to slap him/herself
			message.channel.send(`Warning! Low IQ behavior detected. Please do not slap yourself`)
			break;
		case '3NR3I-Prototype#3325': // Bot specific
			data.filter(x => x.name === caster_tag)[0].health = 0
			message.channel.send(`Threat detected! Casting crippling slap on ${caster}. Target HP reduced to 0`)
			break;
		default:
			// Default slapping behaviour
			let damage = 35;
			const max_health = 100;

			// Check current health, if zero, 
			const current_health = data.filter(x => x.name === target_tag)[0].health

			if (current_health === 0) {
				message.channel.send(`${target} is already dead. Please raise target to contiune`);
			} else {

				// If user does not have enough HP to survive damage, set HP to 0
				if (current_health - damage <= 0) {
					message.channel.send(`Slaps ${target} to death.`);
					data.filter(x => x.name === target_tag)[0].health = 0;
				} else {
					// If target doesn't die, calculate remaining health
					let new_health = current_health - damage;
					message.channel.send(`Slaps ${target} for ${damage} HP - Remaining health ${new_health}/${max_health} `);
					data.filter(x => x.name === target_tag)[0].health = new_health
				}
			}

	}
}

const coverHandler = (message) => {
	const caster = message.member;
	const caster_tag = message.member.user.tag;

	// Check if caster has Tank role
	if (!(message.member.roles.cache.some(role => role.name === 'Tank'))) {
		// if caster is not a Tank 
		message.channel.send(`Error. Only Tanks are allowed to cast cover`)
		return
	}

	// Get target as first user mentioned
	const target = message.mentions.members.first();

	// Error handler - Invalid Target
	if (typeof target === 'undefined') {
		message.channel.send(`Invalid Target`)
		return
	}

	// Get target tag
	const target_tag = target.user.tag

	if (caster_tag === target_tag) {
		message.channel.send(`Error. Unable to cast cover on self!`)
		return
	}
	// If target health is 0
	if (data.filter(x => x.name === target_tag)[0].health === 0) {

		message.channel.send(`Error. Unable to cast cover on dead target`)

	} else {
		data.filter(x => x.name === target_tag)[0].cover = caster_tag
		message.channel.send(`${caster} casts cover on ${target}, absorbing next incoming attack! [Under development]`)
	}
}

// petHandler +5 hp up to max
// DPS Damage boost
// Tank traits - Mitigation? Next x seconds? Charge system 
// Data persistance
