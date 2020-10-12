// Player class prototype - To be externalised
module.exports = class Inventory {

	constructor() {
		this.items = new Map();
		this.tools = new Map();
	}

	addItem(item, count) {
		if (this.items.has(item)) {
			console.log('item exists')
			const current_stock = this.items.get(item);
			this.items.set(item, current_stock + count)
		} else {
			console.log('item doesnt exist, adding item')
			this.items.set(item, count)
			console.log(this.items.has(item))
		}
	}

	addTool(tool, count) {
		if (this.tools.has(tool)) {
			const current_stock = this.tools.get(tool);
			this.tools.set(tool, current_stock + count)
		} else {
			this.tools.set(tool, count)
		}
	}






}