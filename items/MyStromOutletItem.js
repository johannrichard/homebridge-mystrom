"use strict";

var request = require("request");
var util = require("util");

var MyStromOutletItem = function(device, platform, homebridge) {
	MyStromOutletItem.super_.call(this, device, platform, homebridge);

    this.baseUrl = this.device.url;
	this.onUrl = this.baseUrl + "/relay?state=1";
	this.offUrl = this.baseUrl + "/relay?state=0";
	this.statusUrl = this.baseUrl + "/report";
	this.url = this.statusUrl; // FIXME: Consolidate
	this.localDevice = true;
};

// TODO: Implement specifics of "local" outlets
MyStromOutletItem.prototype.getItemState = function(callback) {
	var self = this;
	this.checkListener();

    // TODO: Update "inUse"
	this.log("Request power state from " + this.name);
	request(this.statusUrl, 
	    { json: true },
		function(error, response, json) {
			if (!error && response.statusCode == 200) {
				self.log("Response from " + self.name + ": 200 OK");
				if (typeof json.relay != 'undefined') {
					callback(undefined, json.relay === 'on');
				}
			} else {
				self.log("Error from " + self.name + ": " + error);
			}
		}
	);
}

MyStromOutletItem.prototype.setItemState = function(powerOn, callback) {
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

    var url;

	if (!this.onUrl || !this.offUrl) {
		this.log.warn("Ignoring request; No power url defined.");
		callback(new Error("No power url defined."));
		return;
	}

	if (powerOn) {
		url = this.onUrl;
		this.log("Setting power state to on");
	} else {
		url = this.offUrl;
		this.log("Setting power state to off");
	}

	request(url, 
	    { json: true },
		function(error, response, json) {
			if (!error && response.statusCode == 200) {
				self.log("Response from " + self.name + ": 200 OK");
			} else {
				self.log("Error from " + self.name + ": " + error);
				throw new Error("Die!");
			}
			callback();
		});
}

MyStromOutletItem.prototype.updateCharacteristics = function(message) {

	this.log("Update characteristics of " + this.name);
	if (typeof message != 'undefined' && typeof message.relay != 'undefined') {
		// Only update if data is really available
		this.log("Message: " + util.inspect(message));
		this.setFromMyStrom = true;
		this.otherService
			.getCharacteristic(this.homebridge.hap.Characteristic.On)
			.setValue(message.relay,
				function() {
					this.setFromMyStrom = false;
				}.bind(this)
		);

		this.otherService
			.getCharacteristic(this.homebridge.hap.Characteristic.OutletInUse)
			.setValue(message.power > 0,
				function() {
					this.setFromMyStrom = false;
				}.bind(this)
		);
	}

};

module.exports = MyStromOutletItem;
