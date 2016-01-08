'use strict';

var Homebridge, Accessory, Service, Characteristic;

var request = require("request");
var pollingtoevent = require('polling-to-event');

var ItemFactory = require('./libs/ItemFactory.js');
var Utility = require('./libs/Utility.js');

module.exports = function(homebridge) {
	Accessory = homebridge.hap.Accessory;
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	Homebridge = homebridge;

	Utility.addSupportTo(ItemFactory.AbstractItem, Accessory);
	Utility.addSupportTo(ItemFactory.SwitchItem, ItemFactory.AbstractItem);
	Utility.addSupportTo(ItemFactory.OutletItem, ItemFactory.SwitchItem);

	homebridge.registerAccessory("homebridge-mystrom", "myStrom", myStromAccessory);
	homebridge.registerPlatform("homebridge-mystrom", "myStromCloud", myStromPlatform);
}


//////// PLATFORM /////////

function myStromPlatform(log, config) {
	this.log = log;
	this.name = config["name"];

	if (typeof config["email"] != 'undefined' && typeof config["password"] != 'undefined' && typeof config["authToken"] == 'undefined') {
		this.email = config["email"];
		this.password = config["password"];

		throw new Error("You are using email & password to authenticate. This is potentially unsafe and you should switch to authToken authentication.\n" +
			"Please consult the README for more information.");
	}

	if (typeof config["authToken"] != 'undefined') {
		this.authToken = config["authToken"];
	} else {
		throw new Error("Your configuration file is missing the 'authToken' for authentication at the myStrom Cloud Platform.\nPlease consult the README for more information.");
	}
	if (typeof config["customAttrs"] != 'undefined') {
		this.customAttrs = config["customAttrs"];
	} else {
		this.customAttrs = [];
	}

	this.host = config["host"] || "mystrom.ch";
	this.protocol = "https";

	this.log("Auth information: " + this.authToken);
}

myStromPlatform.prototype.accessories = function(callback) {
	var that = this;
	this.log("Platform - Fetching myStrom devices.");
	var itemFactory = new ItemFactory.Factory(this, Homebridge);

	this.baseUrl = itemFactory.baseUrl();
	this.authToken = itemFactory.authenticateUser();
	this.log("Platform - User authenticated ");

	var devices = this.baseUrl + "/devices?report=true";
	request.post(devices, {
			form: {
				"authToken": that.authToken
			},
			json: true,
		},
		function(err, response, json) {
			if (!err && response.statusCode == 200) {
				if (json.status == "error") {
					that.log("Platform - There was a problem connecting to myStrom: " + json.error);
					throw new Error("Platform - There was a problem connecting to myStrom: " + json.error);
				} else {
					callback(itemFactory.parseSitemap(json));
				}
			} else {
				that.log("Platform - There was a problem connecting to myStrom.");
				throw new Error("Platform - There was a problem connecting to myStrom.");
			}
		});
};

////////////// Accessory

function myStromAccessory(log, config) {
	this.log = log;

	// Configuration
	this.name = config["name"];

	this.base_url = "http://" + config["switch_address"];
	this.on_url = this.base_url + "/relay?state=1";
	this.off_url = this.base_url + "/relay?state=0";
	this.status_url = this.base_url + "/report";

	this.state = false;
	this.inUse = false;

	var that = this;

	var emitter = pollingtoevent(function(done) {
		that.httpRequest(that.status_url, function(error, response, responseBody) {
			if (error) {
				that.log('HTTP get power function failed: %s', error.message);
				callback(error);
			} else {
				done(null, responseBody);
			}
		})
	}, {
		longpolling: true,
		interval: 2000
	});

	emitter.on("longpoll", function(data) {
		var relay = JSON.parse(data)['relay'];
		var power = JSON.parse(data)['power'];

		that.state = relay;
		that.inUse = power > 0;

		if (that.outletService) {
			that.outletService.getCharacteristic(Characteristic.On)
				.setValue(that.state);
			that.outletService.getCharacteristic(Characteristic.OutletInUse)
				.setValue(that.inUse);
		}
	});
}

myStromAccessory.prototype = {

	httpRequest: function(url, callback) {
		request.get(url, function(error, response, body) {
			callback(error, response, body)
		})
	},

	setPowerState: function(powerOn, callback) {
		var url;

		if (!this.on_url || !this.off_url) {
			this.log.warn("Ignoring request; No power url defined.");
			callback(new Error("No power url defined."));
			return;
		}

		if (powerOn) {
			url = this.on_url;
			this.log("Setting power state to on");
		} else {
			url = this.off_url;
			this.log("Setting power state to off");
		}

		this.httpRequest(url, function(error, response, responseBody) {
			if (error) {
				this.log('HTTP set power function failed: %s', error.message);
				callback(error);
			} else {
				this.log('HTTP set power function succeeded!');
				callback();
			}
		}.bind(this));
	},

	identify: function(callback) {
		this.log("Identify requested!");
		callback(); // success
	},

	getServices: function() {
		var that = this;
		// you can OPTIONALLY create an information service if you wish to override
		// the default values for things like serial number, model, etc.
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, "myStrom AG")
			.setCharacteristic(Characteristic.Model, "myStrom WLAN Energy Control Switch")
			.setCharacteristic(Characteristic.SerialNumber, "HTTP Serial Number");

		this.outletService = new Service.Outlet(this.name);
		this.outletService
			.getCharacteristic(Characteristic.On)
			.on('get', function(callback) {
				callback(null, that.state)
			})
			.on('set', this.setPowerState.bind(this));
		this.outletService.getCharacteristic(Characteristic.OutletInUse)
			.on('get', function(callback) {
				callback(null, that.inUse)
			});
		return [informationService, this.outletService];
	}
};
