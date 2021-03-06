# Dash Cam

Dash Cam is a cross-platform application that enables Android or iOS devices to be used a dash camera mounted in the car. This is a cheap but reliable alternative to buying a commercial dash camera. 

## Setup

This app uses the Google Maps and Geocoding API to display the user's position on a map and to get the closest street address. 
The API key has been removed from this repository to avoid API key abuse.

However, you can use your own key by visting the [Google Developer Console](https://console.developers.google.com/) and generating credentials for the Maps Javascript API and Geocoding API.

This is inserted into Google Maps javascript tag at the bottom of```index.html``` to enable all of the app's features:

```html
...
<body>
    ...
    <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY" async defer></script> 
</body>
```

You can run the application without the API key. However, some critical features may not work. 
## Installation

The build files for Android and iOS are generated from HTML, CSS and JS using the [PhoneGap Build](https://build.phonegap.com/) service. 

Therefore, you can provide PhoneGap Build with a compressed (zipped) www directory that contains `config.xml` to build the application yourself. You will need the necessary signing certificates for the desired platform. 

*__WARNING:__ This project is no longer maintained. Therefore it may require adjustments to `config.xml` to build correctly on newer OS versions.*
## Features

The Application makes use of [jQuery Mobile](https://jquerymobile.com/) to provide a responsive interface that is optimised for mobile devices. 

Cordova [plugins](https://build.phonegap.com/plugins) are used to leverage the features of smartphones such as the camera and geolocation from within JavaScript code. Further plugins are available from [npm](https://www.npmjs.com/search?q=cordova-plugin) and [GitHub](https://github.com/search?q=cordova-plugin).

Dash Cam provides:
* Continuous Recording – all activity in front of the device is recorded and stored on the device so that you can save accidents and exciting events.
* Collision Detection – important contacts can be immediately notified when you are in a collision to help support you.
* Video Playback and Sharing – footage can be viewed without leaving the app and shared to other platforms easily so that it can be viewed by your insurer or friends.
* Map View – view, add and remove markers on a map to indicate hazardous locations you wish to avoid.
* Notifications – alerts you when entering a hazardous location so that you can be more aware of potential hazards.

![Feature Screenshots](https://user-images.githubusercontent.com/35703802/67806494-e707f500-fa8a-11e9-83c5-4f75eecc6840.png "Screenshots of Dash Cam's core functionality")

*From left to right, the image shows the: camera page, maps page, offline alert, files page, file viewer, share menu, info page and the automated text alert system.*
## Author

Daniel Turner - [turnerdaniel](https://github.com/turnerdaniel/)