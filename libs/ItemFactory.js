"use strict";
var exports = module.exports = {};
exports.AbstractItem = require('../items/AbstractItem.js');
exports.SwitchItem = require('../items/SwitchItem.js');
exports.OutletItem = require('../items/OutletItem.js');

exports.Factory = function(myStromPlatform, homebridge) {
	this.platform = myStromPlatform;
	this.log = this.platform.log;
	this.homebridge = homebridge;
	this.itemList = [];
};

exports.Factory.prototype.baseUrl = function() {
	return this.platform.protocol + "://" + this
		.platform.host + "/mobile";
};

exports.Factory.prototype.authenticateUser = function() {
	var serverString = this.platform.host;
	//TODO da verificare
	if (this.platform.user && this.platform.password) {
		throw new Error("username & password auth not yet implemented");
	}

	return this.platform.authToken;
};


exports.Factory.prototype.parseSitemap = function(jsonDeviceMap) {
	var accessoryList = [];
	var self = this;

	if ('devices' in jsonDeviceMap) {
		this.log("Found " + jsonDeviceMap.devices.length + " devices in " + this.platform.name);
		jsonDeviceMap.devices.forEach(function(device) {
			if (device.type == "wsw") {
				var accessory = new exports.OutletItem(device, self.platform, self.homebridge);
				self.log("Platform - Accessory Found: " + device.name);
				accessoryList.push(accessory);
			}
		});
	} else {
		this.log("No devices found. Go buy some!");
	}

	return accessoryList;
};

exports.Factory.prototype.checkCustomAttrs = function(widget, platform) {
	widget.manufacturer = "OpenHAB";
	widget.model = widget.type;
	widget.itemType = widget.type;
	widget.serialNumber = widget.name;
	widget.skipItem = false;

	//cicle customAttrs
	if ('customAttrs' in platform) {
		for (var key in platform.customAttrs) {
			if (platform.customAttrs.hasOwnProperty(key) && platform.customAttrs[key]['itemName'] === widget.name) {
				if (typeof platform.customAttrs[key]['itemLabel'] !== 'undefined') {
					widget.label = platform.customAttrs[key]['itemLabel'];
				}
				if (typeof platform.customAttrs[key]['itemManufacturer'] !== 'undefined') {
					widget.manufacturer = platform.customAttrs[key]['itemManufacturer'];
				}
				if (typeof platform.customAttrs[key]['itemSerialNumber'] !== 'undefined') {
					widget.serialNumber = platform.customAttrs[key]['itemSerialNumber'];
				}
				if (typeof platform.customAttrs[key]['itemType'] !== 'undefined') {
					widget.itemType = platform.customAttrs[key]['itemType'];
					widget.model = widget.itemType;
				}
				if (typeof platform.customAttrs[key]['itemModel'] !== 'undefined') {
					widget.model = platform.customAttrs[key]['itemModel'];
				}
				if (typeof platform.customAttrs[key]['skipItem'] !== 'undefined') {
					widget.skipItem = platform.customAttrs[key]['skipItem'];
				}
			}
		}
	}
	return widget;
};
