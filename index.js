var Service, Characteristic;
var request = require("request");
var pollingtoevent = require('polling-to-event');

module.exports = function(homebridge){
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory("homebridge-mystrom", "myStrom", myStromAccessory);
}


function myStromAccessory(log, config) {
  this.log = log;

 	// Configuration
	this.name                   = config["name"];

	this.base_url         		= "http://" + config["switch_address"] ;
	this.on_url                 = this.base_url + "/relay?state=1";
	this.off_url                = this.base_url + "/relay?state=0";
	this.status_url            	= this.base_url + "/report";

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
    	}, {longpolling:true,interval:2000});

	emitter.on("longpoll", function(data) {   
        	var relay = JSON.parse(data)['relay'];
        	var power = JSON.parse(data)['power'];

	        that.state = relay;
	        that.inUse = power > 0;
			that.log(that.service, "received data from url:"+that.status_url, "state is currently", data.toString()); 
			
			if (that.outletService ) {
				that.outletService.getCharacteristic(Characteristic.On)
				.setValue(that.state)
				.getCharacteristic(Characteristic.OutletInUse)
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
	this.outletServiceswitchService
	 .getCharacteristic(Characteristic.On)
	 .on('get', function(callback) {callback(null, that.state)})
	 .on('set', this.setPowerState.bind(this))
	 .getCharacteristic(Characteristic.OutletInUse)
	 .on('get', function(callback) {callback(null, that.inUse)});
	return [this.outletService];
  }
};
