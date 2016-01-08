"use strict";

var PollListener = require('../libs/PollListener.js');

var AbstractItem = function(device, platform, homebridge) {
	this.platform = platform;
	this.device = device;
	this.homebridge = homebridge;

	this.manufacturer = "myStrom AG";

	// TODO: This might change depending on the deviceTypeName
	this.model = "myStrom WLAN Energy Control Switch";

	this.label = this.device.deviceTypeName;
	this.id = this.device.id;
	this.state = this.device.state;
	this.log = this.platform.log;

	this.setInitialState = false;
	this.setFromMyStrom = false;
	this.informationService = undefined;
	this.otherService = undefined;
	this.listener = undefined;
	this.pte = undefined;

	this.name = this.device.name + " (" + this.label + ")";

	AbstractItem.super_.call(this, this.name, homebridge.hap.uuid.generate(String(this.device.id)));

};

AbstractItem.prototype.getServices = function() {
	this.checkListener();
	this.setInitialState = true;
	this.informationService = this.getInformationServices();
	this.otherService = this.getOtherServices();
	return [this.informationService, this.otherService];
};

AbstractItem.prototype.getOtherServices = function() {
	return null;
};

AbstractItem.prototype.getInformationServices = function() {
	var informationService = new this.homebridge.hap.Service.AccessoryInformation();

	informationService
		.setCharacteristic(this.homebridge.hap.Characteristic.Manufacturer, this.manufacturer)
		.setCharacteristic(this.homebridge.hap.Characteristic.Model, this.model)
		.setCharacteristic(this.homebridge.hap.Characteristic.SerialNumber, this.serialNumber)
		.setCharacteristic(this.homebridge.hap.Characteristic.Name, this.name);
	return informationService;
};


AbstractItem.prototype.checkListener = function() {
	if (typeof this.listener == 'undefined' || typeof this.pte == 'undefined') {
		this.pte = undefined;
		this.listener = new PollListener(this, this.updateCharacteristics.bind(this));
		this.listener.startListener();
	}
};

module.exports = AbstractItem;
