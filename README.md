# homebridge-mystrom

Supports myStrom (http://mystrom.ch) devices on the HomeBridge Platform and provides a real time polling for getting the "On" and power level characteristics to Homekit. Implements an "Outlet" service for HomeKit.

# Installation

1. Install homebridge using: npm install -g homebridge
2. Install this plugin by cloning this repo.
3. Update your configuration file. See sample-config.json in this repository for a sample. 

# Configuration

Configuration sample:

 ```
"accessories": [ 
	{
		"accessory": "myStrom",
		"name": "myStrom WLAN Energy Control Switch",
		"switch_address": "192.168.1.42",
       } 
    ]
```
