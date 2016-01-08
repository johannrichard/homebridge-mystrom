# homebridge-mystrom

Supports myStrom (http://mystrom.ch) devices on the HomeBridge Platform and provides a real time polling for getting the "On" and power level characteristics to Homekit. Implements an "Outlet" service for HomeKit.

The current version of the plugin supports two different modes

* Individual accessories: These are configured as local devides (i.e. not external network connection required), with the help of the Switch API (https://mystrom.ch/en/mystrom-api)
* myStrom Cloud platform: This mode uses information retrieved from the myStrom Cloud service to create all registered accessories under your myStrom account in HomeKit. You need an authentication key that you have to generate yourself (See below). This mode uses the myStrom Mobile API (https://mystrom.ch/mobile) and might break in the future. 

# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-mystrom`
3. Update your configuration file. See sample-config.json in this repository for a sample. 

# Configuration

Configuration sample:

 ```json
{
    "accessories": [
        {
            "accessory": "myStrom",
            "name": "myStrom WLAN Energy Control Switch",
            "switch_address": "10.0.0.42"
        }
    ],
    "bridge": {
        "name": "myStrom HomeBridge",
        "pin": "042-45-555",
        "port": 51826,
        "username": "CC:33:3D:E3:CE:42"
    },
    "description": "HomeBridge myStrom Status Control.",
    "platforms": [
        {
            "authToken": "EF0IRZjqWEuSf2GH-X4Sb6b3wEQ1k6O7m",
            "host": "mystrom.ch",
            "name": "myStrom Cloud",
            "platform": "myStromCloud",
            "type": "service"
        }
    ]
}


```

# myStrom Cloud Authentication
IF you want to use the myStrom Cloud platform, you have to retrieve an authentication token. The easiest way under Linux / Mac OS X is via curl:

`curl -X POST -d 'email=<your-email>&password=<yourpassword>' https://mystrom.ch/mobile/auth`

You will get a response along the following lines, printed out on the command line:

```json
{
    "status":"ok",
    "authToken":"0XBfQzVWRWuhNeFe-C5RWFCx9MjYjFvf2",
    ... same data as in profile response ...
}
```

Just copy the `"authToken":"0XBfQzVWRWuhNeFe-C5RWFCx9MjYjFvf2",` into your `config.json` file and you should be set for Go!

# Homebridge as a `systemd` service under Linux

In order to run homebridge as a service on Linux systems with [`systemd`](https://wiki.debian.org/systemd), you have to create the corresponding definitions. I've created [a gist](https://gist.github.com/johannrichard/0ad0de1feb6adb9eb61a) with some instructions on how to do this.
