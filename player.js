// Player class prototype - To be externalised
module.exports = class Player {

	constructor(member) {
		this.name = member.user.tag,
			this.health = 100, // Max health 
			this.cover = null, // Default cover status
			this.rage = 0 // Default rage status
	}
}