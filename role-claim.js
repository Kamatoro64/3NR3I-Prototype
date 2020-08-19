const firstMessage = require('./first-message')

module.exports = (client, channelId) => {

	const getEmoji = emojiName => client.emojis.cache.find(emoji => emoji.name === emojiName)

	const emojis = {
		tank: 'Tank',
		healer: 'Healer',
		dps: 'DPS'
	}

	const reactions = []

	let emojiText = 'Welcome to the server! Please select a role: \n\n'
	for (const key in emojis) {
		const emoji = getEmoji(key)
		reactions.push(emoji)

		const role = emojis[key]
		emojiText += `${emoji} = ${role}\n`
	}
	emojiText += "\n"

	firstMessage(client, channelId, emojiText, reactions)

	const handleReaction = (reaction, user, add) => {
		//Ignore bot (right click and copy id of the BOT)
		if (user.id === '744835465991159831') {
			return
		}

		//console.log(emoji) to see structure if interested
		const emoji = reaction._emoji.name

		// Destructure
		const { guild } = reaction.message


		const roleName = emojis[emoji]

		// This should not happen if users do not have permissions to add additional emojis
		if (!roleName) {
			return
		}

		const role = guild.roles.cache.find(role => role.name === roleName)
		const member = guild.members.cache.find(member => member.id === user.id)

		if (add) {
			member.roles.add(role)
		} else {
			member.roles.remove(role)
		}
	}

	//listeners

	client.on('messageReactionAdd', (reaction, user) => {
		if (reaction.message.channel.id === channelId) {
			handleReaction(reaction, user, true)
		}

	})

	client.on('messageReactionRemove', (reaction, user) => {
		if (reaction.message.channel.id === channelId) {
			handleReaction(reaction, user, false)
		}
	})


}