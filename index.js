const Discord = require('discord.js');
const { prefix, serverId, raidChannelId, riverChannelId } = require('./config.json');
const schedule = require('node-schedule');
const Player = require('./player');
const fetch = require("node-fetch");

const client = new Discord.Client();

// Temporary storage for character data
let data = []

let fish_species = [
	{ name: 'Freshwater eel', rate: 0.3 },
	{ name: 'River chub', rate: 0.6 },
	{ name: 'Rainbow trout', rate: 0.1 }
]

client.on("guildCreate", guild => {
	client.channels.cache.find(channel => channel.name === "general").send(`
Patch notes 23/8/2020:

!fish Command added
	
`);
})
/* // Temporarily commenting for rollback
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
*/

client.once('ready', () => {

	console.log(`test`)

	client.guilds.get(serverId).members.cache.forEach(member => {
		data.push(new Player(member))
	})

	console.log(data)

	// JOB Assignments
	data.find(player => player.name === 'kageneko#2670').job = 'SAM';
	data.find(player => player.name === 'kageneko#2670').sen = 0;


	// JOB Assignments
	data.find(player => player.name === 'insom#8258').job = 'SAM';
	data.find(player => player.name === 'insom#8258').sen = 0;



	console.log('Character data initialised (Player class): \n', data)

	console.log('Ready!');

	function replenishEnergy() {
		increment = 5;

		//console.log('Replenishing energy');

		data.forEach(player => {
			//console.log(player.energy)
			if ((player.energy + increment) >= 100) {
				player.energy = 100
			} else {
				player.energy += increment
			}
		})

	}

	// Every minute
	setInterval(replenishEnergy, 60000);
})

// Adding a bot command
// 3. Add to bot_commands array to register
// 2. Add case in switch statement
// 1. Add a handler for the command

const bot_commands = ['midare', 'raid', 'slap', 'raise', 'cover', 'pet', 'fish', 'mount']

client.on('message', message => {

	// Get bot command
	bot_command = getBotCommand(message)

	// Get caster details
	const caster = message.member;
	const caster_tag = message.member.user.tag;

	// Check if caster is dead, also prevents healers from self raising
	console.log(caster_tag)
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
		case `${prefix}midare`:
			midareHandler(message)
			console.log('State: \n', data)
			break
		case `${prefix}fish`:
			fishHandler(message)
			console.log('State: \n', data)
			break
		case `${prefix}mount`:
			mountHandler(message)
			break
	}
})

client.login(process.env.DJS_TOKEN);


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
	const player = data.find(player => player.name === caster_tag)

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
			message.channel.send(`${caster}, are you alright? Do you require assistance/lubrication?`)
			break;
		case '3NR3I-Prototype#3325': // Bot specific
			message.channel.send(`UwU Wait a second, am I... enjoying this?`)
			break;
		default:
			// Default petting behaviour
			const max_health = 100
			const pet_heal = 5

			// Get target's current health
			const current_health = data.filter(x => x.name === target_tag)[0].health

			// If player is samurai, check sen conditions and x use default pet mechanic
			if (player.job === 'SAM') {
				if (target_tag === 'Saffron#7787') {

					if (player.name === 'insom#8258' || player.name === 'kageneko#2670') { // Filtering on sig for spefic lyra interaction

						if (player.sen === 3) {
							// Sen gauge full
							message.channel.send(`${caster} gently pets ${target}`)
						} else {
							// Increase sen by 1
							player.sen += 1

							message.channel.send(`${caster} gently pets ${target}, Sen gauge +1 (${player.sen}/3)`)
						}
					}
				} else {
					message.channel.send(`${caster} gently pets ${target}`)
				}
			} else {

				// Pet behaviour based on target's current HP
				switch (current_health) {
					case 0:
						message.channel.send(`* Watches curiously as ${caster} gently pets ${target}'s lifeless body...`);
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
}

const midareHandler = (message) => {

	// Message user logic
	const caster = message.member;
	const caster_tag = message.member.user.tag;
	const player = data.find(player => player.name === caster_tag)

	// If player is a samurai
	if (player.job === 'SAM') {


		// Check if target has 3 sen!
		if (player.sen === 3) {

			// Get target as first user mentioned
			let target = message.mentions.members.first();

			// Error handler - Invalid Target
			if (typeof target === 'undefined') {
				message.channel.send(`Invalid Target`)
				return
			}

			// Get target tag
			let target_tag = target.user.tag

			switch (target_tag) {
				case caster_tag: // midare cannot be used on self
					message.channel.send(`Error. Unable to cast on self`)
					break;
				case '3NR3I-Prototype#3325': // Bot specific - Immune (but should consume sen)
					message.channel.send(`3NR3I casts Hallowed Ground. 0 Damage taken`)
					break;
				default:
					// Default midare behaviour
					let damage = 300;
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
					// At this point check if the caster is the tank him/herself in the first place (for midare this should not happen)
					if (caster_tag === target_tag) {
						message.channel.send(`Error. You may not cast Midare Setsugekka on target you're covering!`)
						return
					}

					let rage_damage = data.filter(x => x.name === caster_tag)[0].rage

					// Check current health, if zero, 
					const current_health = data.filter(x => x.name === target_tag)[0].health

					if (current_health === 0) {
						message.channel.send(`Error. Unable to execute on dead target`);
					} else {

						// If user does not have enough HP to survive damage, set HP to 0 
						if ((current_health - damage - rage_damage) <= 0) {

							// Set health to 0
							data.filter(x => x.name === target_tag)[0].health = 0;
							// Set rage to 0
							data.filter(x => x.name === target_tag)[0].rage = 0;


							// Sig specific animation
							if (player.name === 'insom#8258') {
								message.channel.send(`${caster} unleashes midare setsugekka on ${target}. Total damage = ${damage} + ${rage_damage} (rage damage). Target eliminated`, { files: ["https://thumbs.gfycat.com/YearlySardonicHarpseal-size_restricted.gif"] });
							} else {
								message.channel.send(`${caster} unleashes midare setsugekka on ${target}. Total damage = ${damage} + ${rage_damage} (rage damage). Target eliminated`, { files: ["https://thumbs.gfycat.com/EasygoingHeartyChuckwalla-size_restricted.gif"] });
							}



						} else {
							// If target doesn't die, calculate remaining health. Should not happen for Midare at this point
							let new_health = current_health - damage - rage_damage;
							data.filter(x => x.name === target_tag)[0].health = new_health
							data.filter(x => x.name === target_tag)[0].rage += rage_value;
							message.channel.send(`Slaps ${target} for ${damage} + ${rage_damage} (rage damage) HP - Remaining HP ${new_health}/${max_health}, Target rage +${rage_value}`);


						}
						// If slap was successful, reset rage gauge to 0
						data.filter(x => x.name === caster_tag)[0].rage = 0
						// Reset sen gauge
						player.sen = 0
					}

					// Alwyas remove original target's cover status, no matter if tank dies or not
					data.filter(x => x.name === message.mentions.members.first().user.tag)[0].cover = null

			}


		} else {
			const current_sen = player.sen
			message.channel.send(`Insufficient Sen! Current Sen gauge (${current_sen}/3)`)
		}
	}


}

const fishHandler = (message) => {
	const energy_requirement = 25;
	const caster = message.member;
	const caster_tag = message.member.user.tag;

	// Everyone can fish for now so no role checks

	// No specific target, only limitation is that it can only be done in river channel
	if (message.channel.id === riverChannelId) {
		const current_energy = data.filter(x => x.name === caster_tag)[0].energy
		if (current_energy < energy_requirement) {
			message.channel.send(`You look tired. Maybe you should take a break to recover. I.. I made you some rice balls. I'm not sure what they taste like but according to my database they're a good source of energy. Energy: ${current_energy}/100 `)
			return
		} else {
			data.filter(x => x.name === caster_tag)[0].energy -= energy_requirement
		}

		const fish_roll = Math.random();
		const fish_type_roll = Math.random();
		const otter_roll = Math.random();

		// as hook rate inreases, chances increases (higher probability that random number is <= hook rate)
		const hook_rate = 0.4;
		const otter_rate = 0.5;
		let fish_type = fish_species.filter(fish => fish_type_roll >= 1 - fish.rate).sort((a, b) => a.rate - b.rate)[0]


		if (typeof fish_type === 'undefined') {

			fish_type = fish_species.sort((a, b) => a.rate - b.rate)[fish_species.length - 1]

		}


		// Implement fish types types and value

		if (fish_roll >= hook_rate && otter_roll >= otter_rate) { // Catch and keep 0.6 * 0.5= 0.3

			// Add fish to inventory (items)
			data.filter(x => x.name === caster_tag)[0].inventory.addItem(fish_type.name, 1);

			// Get new count
			const new_count = data.filter(x => x.name === caster_tag)[0].inventory.items.get(fish_type.name)

			// Tell user fish caught and display new count
			message.channel.send(`:fishing_pole_and_fish: You managed to catch a ${fish_type.name}! - ${fish_type.name} has been added to your inventory (current: ${new_count})`)

		}
		else if (fish_roll >= hook_rate && otter_roll < otter_rate) { // Catch but otter steals 0.6*0.5=0.3
			message.channel.send(`:otter: You managed to catch a ${fish_type.name} but a wild otter appears and runs away with your catch!`)
		} else { // 0.4
			message.channel.send(`You didn't manage to catch anything...`)
		}
		console.log(data.filter(x => x.name === caster_tag)[0].inventory.items)

	} else {
		message.channel.send(`There doesn't seem to be anywhere to fish here, maybe we could check out the nearby river. It..It's not like I want to come with you or anything! I just don't want to have to look for you if you get lost!`)
	}


}

const raidHandler = async (message) => {

	if (message.channel.id === raidChannelId) {
		message.reply(`Do not run the !raid command in this channel! The last message of this channel should reflect the latest raid schedule.`)
		return
	}
	// async await here? 

	// Get channel from by fetching raidChannelId (config.json)
	raid_channel = await client.channels.fetch(raidChannelId)

	raid_channel.messages.fetch({ limit: 1 }).then(messages => {

		message.channel.send(`${messages.first().content}`)
	}).catch(err => {
		console.error(err)
	})


}

const mountHandler = async (message) => {


	// async await here? 

	// Get channel from by fetching raidChannelId (config.json)

	const search_string = message.content.replace("!mount ", "");

	await fetch("https://ffxivcollect.com/api/mounts").then(res => res.json()).then(json => {
		// Find by name
		let result = json.results.find(mount => mount.name.toUpperCase() === search_string.toUpperCase())

		if (typeof result === 'undefined') {
			// try source name (usually trial name)

			const result = json.results.find(mount => mount.sources.some(source => source.text.toUpperCase().includes(search_string.toUpperCase())))
			//console.log(result)
			if (typeof result === 'undefined') {
				message.channel.send(`No results for serch string ${search_string}`)

			} else {
				const embed = new Discord.MessageEmbed()
					.setTitle(result.name)
					.setThumbnail(result.image)
					.addField("Description", result.description)
					.addField("Enhanced Description", result.enhanced_description)
					.addField("Flying", result.flying, "Seats", result.seats)
					.addField("Source Type", result.sources[0].type, "Source Text", result.sources[0].text)
					.addField("Source Text", result.sources[0].text)
				message.channel.send(embed)
				//message.channel.send(JSON.stringify(result, null, 2))
			}

		} else {
			const embed = new Discord.MessageEmbed()
				.setTitle(result.name)
				.setThumbnail(result.image)
				.addField("Description", result.description)
				.addField("Enhanced Description", result.enhanced_description)
				.addField("Flying", result.flying, "Seats", result.seats)
				.addField("Source Type", result.sources[0].type, "Source Text", result.sources[0].text)
				.addField("Source Text", result.sources[0].text)
			message.channel.send(embed)
			//message.channel.send(JSON.stringify(result, null, 2))
		}

	}
	)
}
/* Clears bot messages max 100 at a time
const clearBotMessages = async (message) => {
	if (message.member.hasPermission('ADMINISTRATOR')) {
		await message.channel.messages.fetch({ limit: 100 }).then(messages => {
			botMessages = messages.filter(msg => msg.content === `!clearchannel`)
			message.channel.bulkDelete(botMessages)

		})
	} else {
		message.reply(`You need ADMINISTRATOR permissions to use this command`)
	}
}
*/

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