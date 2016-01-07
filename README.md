# homebridge-mystrom

Supports myStrom (http://mystrom.ch) devices on the HomeBridge Platform and provides a real time polling for getting the "On" and power level characteristics to Homekit. Implements an "Outlet" service for HomeKit.

# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-mystrom`
3. Update your configuration file. See sample-config.json in this repository for a sample. 

# Configuration

Configuration sample:

 ```
{
     "bridge": {
        "name": "HomeBridge",
        "username": "CC:22:3D:E3:CE:30",
        "port": 51826,
        "pin": "031-45-154"
    },
    
    "description": "HomeBridge myStrom Status Control",

    "accessories": [ 
        {
            "accessory": "MyStrom",
            "name": "myStrom WLAN Energy Control Switch",
            "switch_address": "192.168.1.42"
        } 
    ]
}

```

# Homebridge as a systemv service under Linux

In order to run homebridge as a service on Linux systems with [systemd](https://wiki.debian.org/systemd), you have to create the corresponding definitions. I've created [a gist](https://gist.github.com/johannrichard/0ad0de1feb6adb9eb61a) with some instructions on how to do this.
