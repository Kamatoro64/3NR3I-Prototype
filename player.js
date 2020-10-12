const Inventory = require('./inventory');
module.exports = class Player {

	constructor(member) {
		this.name = member.user.tag,
			this.role = this.getRole(member),
			this.job = null,
			this.sen = null,
			this.energy = 100,
			this.health = 100, // Max health 
			this.cover = null, // Default cover status
			this.rage = 0, // Default rage status
			this.inventory = new Inventory()

	}

	// Not ideal but roles are stored in a collection which means the order is not consistent and should be accessed by key value pairs. This is easier

	getRole(member) {
		if (member.roles.cache.some(role => role.name === 'Tank')) {
			return 'Tank'
		} else if (member.roles.cache.some(role => role.name === 'Healer')) {
			return 'Healer'
		} else if (member.roles.cache.some(role => role.name === 'DPS')) {
			return 'DPS'
		} else {
			//console.log('No roles found')
			return undefined
		}

	}


}