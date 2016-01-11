"use strict";

var request = require('request');
var pte = require('polling-to-event');

var PollListener = function(item, callback) {
	this.item = item;
	this.callback = callback;
};

PollListener.prototype.startListener = function() {
	var self = this;
    var options = {};

    // Set options if needed (Authentication and device ID for cloud devices)
    if (!this.item.localDevice) {
        options = {
                    qs: {
                        "id": self.item.id
                    },
                    headers: {
                        "Auth-Token": this.item.platform.authToken
                    }
                };
    }

    options.json = true;

	if (typeof this.item.pte == 'undefined') {
		this.item.pte = pte(function(done) {
			request(self.item.url, options,
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
