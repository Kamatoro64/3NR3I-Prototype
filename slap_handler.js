
module.exports = (message) => {

	// Message user logic
	const caster = message.member;
	const caster_tag = message.member.user.tag;

	switch (caster_tag) {
		case "Shiro#1326":
			message.channel.send(`Error - Lalafells are not allowed to slap. Please switch race and try again. You may purchase a Fantasia potion at the Mog Station`)
			break;
		default:
			console.log('No message user specific logic activated')
	}

	// Retrieve slap target
	const target = message.mentions.members.first();
	const target_tag = target.user.tag

	// Error handler - Invalid Target
	if (typeof target === 'undefined') {
		message.channel.send(`Invalid Target`)
		return
	}

	switch (target_tag) {
		case caster_tag: // Caster attempts to slap him/herself
			message.channel.send(`Warning! Low IQ behavior detected. Please do not slap yourself`)
			break;
		default: // Default slapping behaviour
			let damage = 1;
			const max_health = 100;

			// First check if target user data exists in data array
			if (!(data.some(x => x.name === target_tag))) {

				console.log("No target data found, initialising user with max hp")

				data.push({
					name: target_tag,
					health: 100
				})
			}

			const current_health = data.filter(x => x.name === target_tag)[0].health


			if (current_health - damage <= 0) {
				message.channel.send(`Slaps ${target} to death.`);
			} else {
				// If target doesn't die, calculate remaining health
				let new_health = current_health - danage;
				message.channel.send(`Slaps ${target} for ${damage} HP - Remaining health ${new_health}/${max_health} `);
				data.filter(x => x.name === target_tag)[0].health = new_health
			}

	}
}