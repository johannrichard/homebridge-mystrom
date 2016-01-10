"use strict";

var request = require("request");

var SwitchItem = function(device, platform, homebridge) {
	SwitchItem.super_.call(this, device, platform, homebridge);

    if (this.platform) {
    	this.url = this.platform.baseUrl + "/device";        
    }
};

SwitchItem.prototype.getOtherServices = function() {
	var otherService = new this.homebridge.hap.Service.Switch();

	otherService.getCharacteristic(this.homebridge.hap.Characteristic.On)
		.on('set', this.setItemState.bind(this))
		.on('get', this.getItemState.bind(this))
		.setValue(this.state === 'ON');

	return otherService;
};

SwitchItem.prototype.updateCharacteristics = function(message) {

	this.log("Update characteristics of " + this.name);
	if (typeof message.device != 'undefined' && typeof message.device.state != 'undefined') {
		// Only update if data is really available
		this.setFromMyStrom = true;
		this.otherService
			.getCharacteristic(this.homebridge.hap.Characteristic.On)
			.setValue(message.device.state === 'on',
				function() {
					this.setFromMyStrom = false;
				}.bind(this)
		);
	}
};

SwitchItem.prototype.getItemState = function(callback) {

	var self = this;
	this.checkListener();

	this.log("Request power state from " + this.name);
	request.post(this.url, {
			form: {
				"id": this.id,
				"authToken": this.platform.authToken
			},
			json: true
		},
		function(error, response, json) {
			if (!error && response.statusCode == 200) {
				self.log("Response from " + self.name + ": " + json);
				if (json.status == "error") {
					that.log("There was a problem probing device " + self.id + " from myStrom: " + json.error);
					throw new Error("There was a problem probing device " + self.id + " from myStrom: " + json.error);
				} else {
					if (typeof json.device != 'undefined' && typeof json.device.state != 'undefined') {
						callback(undefined, json.device.state === 'on');
					}
				}
			} else {
				self.log("Error from " + self.name + ": " + error);
			}
		});
};

SwitchItem.prototype.setItemState = function(value, callback) {

	var self = this;
	this.checkListener();

	if (this.setInitialState) {
		this.setInitialState = false;
		callback();
		return;
	}

	if (this.setFromMyStrom) {
		callback();
		return;
	}

	this.log("Send message to " + this.name + ": " + value);
	var command = value == 1 ? true : false;
	request.post(this.url + "/switch", {
			form: {
				"id": this.id,
				"authToken": this.platform.authToken,
				"on": command
			},
			json: true
		},
		function(error, response, json) {
			if (!error && response.statusCode == 200) {
				self.log("Response from " + self.name + ": " + json);
				if (json.status == "error") {
					that.log("There was a problem probing device " + self.id + " from myStrom: " + json.error);
					throw new Error("There was a problem probing device " + self.id + " from myStrom: " + json.error);
				}
			} else {
				self.log("Error from " + self.name + ": " + error);
				throw new Error("Die!");
			}
			callback();
		}
	);
};

module.exports = SwitchItem;
