"use strict";

var PollListener = require('../libs/PollListener.js');

var AbstractItem = function(device, platform, homebridge) {
	this.platform = platform;
	this.device = device;
	this.homebridge = homebridge;

	// TODO: This might change depending on the deviceTypeName
	this.manufacturer = "myStrom AG";
	this.model = "myStrom WLAN Energy Control Switch";

	this.label = this.device.deviceTypeName;
	this.id = this.device.id;
	this.serialNumber = this.id;

	this.state = this.device.state;
	if(this.platform != null) {
	    // We're in "platform" mode"
    	this.log = this.platform.log;    
	} else {
	    // We're in "device" mode (i.e. most probably local)
	    this.log = this.device.log;
	}

	this.localDevice = false;
	this.setInitialState = false;
	this.setFromMyStrom = false;
	this.informationService = undefined;
	this.otherService = undefined;
	this.listener = undefined;
	this.pte = undefined;

    // Add the label to the name if setting from myStrom Cloud
    if(this.label) {
    	this.name = this.device.name + " (" + this.label + ")";        
    } else {
        this.name = this.device.name;
    }

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
		if (this.localDevice) {
    		this.listener.startLocalListener();
		} else {
			this.listener.startCloudListener();
		}
	}
};

module.exports = AbstractItem;
