"use strict";

var request = require('request');
var pte = require('polling-to-event');

var PollListener = function(item, callback) {
	this.item = item;
	this.callback = callback;
};

// TODO: Merge Cloud and Local Listener (Both can use GET requests if needed)
PollListener.prototype.startCloudListener = function() {
	var self = this;

	if (typeof this.item.pte == 'undefined') {
		this.item.pte = pte(function(done) {
			request.post(self.item.url, {
					form: {
						"id": self.item.id,
						"authToken": self.item.platform.authToken
					},
					json: true
				},
				function(error, response, json) {
					if (!error && response.statusCode == 200) {
						if (json.status == "error") {
							self.item.log("There was a problem probing device " + self.item.id + " from myStrom: " + json.error);
						} else {
							done(undefined, json);
						}
					} else {
						self.item.log("Error from " + self.item.name + ": " + error);
					}
				});
		}, {
			longpolling: true,
			interval: 2000
		});
	}

	this.item.pte.on('longpoll', function(message) {
		self.item.log("Polling " + self.item.name);
		self.callback(message);
	});

};

PollListener.prototype.startLocalListener = function() {
	var self = this;

	if (typeof this.item.pte == 'undefined') {
		this.item.pte = pte(function(done) {
			request(self.item.url, 
			    {
					json: true
				},
				function(error, response, json) {
					if (!error && response.statusCode == 200) {
						if (json.status == "error") {
							self.item.log("There was a problem probing device " + self.item.id + " from myStrom: " + json.error);
						} else {
							done(undefined, json);
						}
					} else {
						self.item.log("Error from " + self.item.name + ": " + error);
					}
				});
		}, {
			longpolling: true,
			interval: 2000
		});
	}

	this.item.pte.on('longpoll', function(message) {
		self.item.log("Polling " + self.item.name);
		self.callback(message);
	});

};

module.exports = PollListener;
