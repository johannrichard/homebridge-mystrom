"use strict";

var request = require("request");

var OutletItem = function(device, platform, homebridge) {
	OutletItem.super_.call(this, device, platform, homebridge);
};

OutletItem.prototype.getOtherServices = function() {
	var otherService = new this.homebridge.hap.Service.Outlet();

	otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
		.on('set', this.setItemState.bind(this))
		.on('get', this.getItemState.bind(this))
		.setValue(this.state === 'ON');

	otherService.getCharacteristic(this.homebridge.hap.Characteristic.OutletInUse)
		.on('get', this.getItemState.bind(this))
		.setValue(this.state === 'ON');

	return otherService;
};

OutletItem.prototype.updateCharacteristics = function(message) {

	this.log("Update characteristics of " + this.name);
	if (typeof message.device != 'undefined' && typeof message.device.state != 'undefined') {
		// Only update if data is really available
		this.setFromMyStrom = true;
		this.otherService
			.getCharacteristic(this.homebridge.hap.Characteristic.On)
			.setValue(message.device.stat === 'on',
				function() {
					this.setFromMyStrom = false;
				}.bind(this)
		);

		this.otherService
			.getCharacteristic(this.homebridge.hap.Characteristic.OutletInUse)
			.setValue(message.device.power > 0,
				function() {
					this.setFromMyStrom = false;
				}.bind(this)
		);
	}

};

module.exports = OutletItem;
