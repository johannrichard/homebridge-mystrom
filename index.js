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
    Utility.addSupportTo(ItemFactory.MyStromOutletItem, ItemFactory.OutletItem);

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
	if(typeof config["switch_address"] == 'undefined') {
	    throw new Error("No 'switch_address' configured for " + this.name);
	}

	this.device = {};
	this.device.name = config["name"] || "myStrom WLAN Energy Control Switch";
	this.device.url = "http://" + config["switch_address"];
  if(typeof config["auth_token"] != 'undefined') {
    this.device.token = config["auth_token"];
  } else {
    this.device.token = "";
  }
	this.device.log = this.log;
    
    // There might be a more elegant way	
	return new ItemFactory.MyStromOutletItem(this.device, null, Homebridge);
}
