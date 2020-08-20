const Discord = require('discord.js');
const { prefix, token, serverId, raidChannelId } = require('./config-vault.json');
const schedule = require('node-schedule');
const firstMessage = require('./first-message');
const roleClaim = require('./role-claim');

const client = new Discord.Client();

// Temporary storage for character data
let data = []

client.on("guildCreate", guild => {
	client.channels.cache.find(channel => channel.name === "general").send(`
Patch notes 20/8/2020:

New features
- !cover functionality implemented for Tanks
- !raid  utility now available to retrieve the next raid time. (You need to be alive to cast this)

Action changes 
- !pet no longer increases rage, heal value remains unchanged +5
- !slap damage reduced 25->20. Slap now increases target rage by +30
	
We noticed that users were using the !pet command in a passive aggressive way, this is fine but it did not make sense if a user wanted to use it to console someone when someone is having a bad day (lack of wholesomeness). Hence, !pet was reworked to remove its negative effects. Instead, the rage mechanic was reworked into the slap mechanic.

There is no proper heal mechanic at this stage. !pet is a soft heal for everyone to have fun with at this point, hence it is not role locked to healers
	`);
})

client.once('ready', () => {

	//client.channels.cache.find(channel => channel.name === "general").send(`Patch notes: xxx`);
	//Character initialisation on bot start up, resets on restart
	// CURRENTLY SET TO EDEN TRAUMA
	client.guilds.cache.get(serverId).members.cache.forEach(member => {
		data.push({
			name: member.user.tag,
			health: 100,
			cover: null,
			rage: 0
		})
	})
	console.log('Character data initialised: \n', data)

	console.log('Ready!');
})

// Adding a bot command
// 3. Add to bot_commands array to register
// 2. Add case in switch statement
// 1. Add a handler for the command

const bot_commands = ['raid', 'slap', 'raise', 'cover', 'pet']

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
		case `${prefix}pet`:
			petHandler(message)
			console.log('State: \n', data)
			break
		case `${prefix}raid`:
			raidHandler(message)
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
	let target = message.mentions.members.first();

	// Error handler - Invalid Target
	if (typeof target === 'undefined') {
		message.channel.send(`Invalid Target`)
		return
	}

	// Get target tag (subject to change based on cover status)
	let target_tag = target.user.tag


	switch (target_tag) {
		case caster_tag: // Caster attempts to slap him/herself - Does not remove cover status
			message.channel.send(`Low IQ behaviour detected! Please do not slap yourself!`)
			break;
		case '3NR3I-Prototype#3325': // Bot specific
			// Reduces caster HP to zero, Ignores cover status
			data.filter(x => x.name === caster_tag)[0].health = 0

			// Always reset caster's cover status
			data.filter(x => x.name === caster_tag)[0].cover = null

			message.channel.send(`Threat detected! Casting crippling slap on ${caster}. Target HP reduced to 0`)
			break;
		default:
			// Default slapping behaviour
			let damage = 20;
			const rage_value = 30
			const max_health = 100;

			// Check if user is covered. this will be null if user is not covered
			let new_target_tag = data.filter(x => x.name === target_tag)[0].cover

			if (new_target_tag != null) {

				// if the target's cover property is not null, log it and set it to null

				console.log(`Target is covered, new target tag is ${new_target_tag} (subject to target being alive)`)


				// Check if the covering tank is dead!
				if (data.filter(x => x.name === new_target_tag)[0].health === 0) {
					console.log(`Unable to cover, ${new_target_tag} is dead!`)
					// Immediately remove target's cover status
					data.filter(x => x.name === target_tag)[0].cover = null
				} else {
					// Covering tank is not dead, switch target and target tag
					target_tag = new_target_tag

					target = client.guilds.cache.get(serverId).members.cache.filter(member => member.user.tag === target_tag).first()
				}

			}
			// At this point check if the caster is the tank him/herself in the first place
			if (caster_tag === target_tag) {
				message.channel.send(`Error. You may not slap the target you're covering!`)
				return
			}

			let rage_damage = data.filter(x => x.name === caster_tag)[0].rage

			// Check current health, if zero, 
			const current_health = data.filter(x => x.name === target_tag)[0].health

			if (current_health === 0) {
				message.channel.send(`${target} is already dead. What more do you want?`);
			} else {

				// If user does not have enough HP to survive damage, set HP to 0 
				if ((current_health - damage - rage_damage) <= 0) {

					// Set health to 0
					data.filter(x => x.name === target_tag)[0].health = 0;
					// Set rage to 0
					data.filter(x => x.name === target_tag)[0].rage = 0;

					message.channel.send(`Slaps ${target} to death. Total damage = ${damage} + ${rage_damage} (rage damage)`);

				} else {
					// If target doesn't die, calculate remaining health
					let new_health = current_health - damage - rage_damage;
					data.filter(x => x.name === target_tag)[0].health = new_health
					data.filter(x => x.name === target_tag)[0].rage += rage_value;
					message.channel.send(`Slaps ${target} for ${damage} + ${rage_damage} (rage damage) HP - Remaining HP ${new_health}/${max_health}, Target rage +${rage_value}`);

				}
				// If slap was successful, reset rage gauge to 0
				data.filter(x => x.name === caster_tag)[0].rage = 0
			}

			// Alwyas remove original target's cover status, no matter if tank dies or not
			data.filter(x => x.name === message.mentions.members.first().user.tag)[0].cover = null


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
		if (data.filter(x => x.name === target_tag)[0].cover == null) {
			// If target cover property is null, cover target
			data.filter(x => x.name === target_tag)[0].cover = caster_tag
			message.channel.send(`${caster} casts cover on ${target}, absorbing next incoming attack!`)
		} else {
			message.channel.send(`Error. Target is already being covered!`)
		}
	}
}

const petHandler = (message) => {

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
		case caster_tag: // Caster attempts to pet him/herself
			message.channel.send(`O_O You're trying to pet yourself. Are you okay ${caster}?? This is a safe place, we're here for you!`)
			break;
		case '3NR3I-Prototype#3325': // Bot specific
			message.channel.send(`UwU 3NR3I loves pets`)
			break;
		default:
			// Default petting behaviour
			const max_health = 100
			const pet_heal = 5

			// Get target's current health
			const current_health = data.filter(x => x.name === target_tag)[0].health

			// Pet behaviour based on target's current HP
			switch (current_health) {
				case 0:
					message.channel.send(`3NR3I silently judges you as you gently pat ${target}'s lifeless body...`);
					break;
				case max_health: // No HP change if already at Max health
					message.channel.send(`${caster} gently pets ${target}`);
					break;
				default:
					let new_health = current_health + pet_heal;

					if (new_health >= max_health) {
						new_health = max_health
					}
					// Update target's health and send message
					data.filter(x => x.name === target_tag)[0].health = new_health

					message.channel.send(`${caster} gently pets ${target}. Target health (+${pet_heal})`);

			}

	}
}

const raidHandler = async (message) => {


	// async await here? 

	// Get channel from by fetching raidChannelId (config.json)
	raid_channel = await client.channels.fetch(raidChannelId)
	console.log(raid_channel.messages)
	console.log(typeof raid_channel.messages)

	raid_channel.messages.fetch({ limit: 1 }).then(messages => {

		message.channel.send(`${messages.first().content}`)
	}).catch(err => {
		console.error(err)
	})


}


// DPS Damage boost
// Tank traits - Mitigation? Next x seconds? Charge system 
// Data persistence

// Feedback/Analysis
// Pet mechanic is confusing. Consider shifting rage mechanic to slap and keep pet as a positive action. BALANCE
// Adjust damage. Is 25 base damage too high? It is 25% of user's max HP.
// Unlock higher level skills to balance effort? Levelling system... Red mage melee, midare setsugekka
// RNG for fun. Astrologean cards

// Slap damage: 25
// Rage damage: 50
// Pet heal: 5

// economy system prototype
// !buy potion -> potion + 1 to caster -> use potion -> check potion > 0, heal > potion -1
// !buy other items?
// But how to earn gold? Killing characters for gold is messy and can be toxic. Work toward a common goal maybe (raid boss hp % reward?)


// Raid design
// Boss appears in a different channel and stays there until someone slaps him, upon which he attacks anyone in the (raid? how?)
// Once activated, at fixed intervals it will do fixed mechanics (raid wide + tank buster + autos etc). Aggro system Tank > Healer > DPS (if present and alive
// !join to join raid. Raid boss accepts and adds player to list, cant escape damage if he goes away 

// Raid boss has appeared. !join to join the raid! Raid commences when boss is attacked.
// Begin -> Slapped -> check player list for tank, if yes > target = tank if not dead else healer -> DPS
// Tank deals 10 dmg to tanks, 20 to healers and DPS for example, auto every 5 seconds on primary target (10 hits kills a tank if not healed)