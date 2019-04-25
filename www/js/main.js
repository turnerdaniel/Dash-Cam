"use strict";

//Global Variables
//Hold all recored videos
var mediaFiles = [];
//Hold GMaps marker objects
var markers = [];
//Hold map element
var map;
//Hold user's location
var currentLocation;
//Hold the geolocation watch ID to allow revocation
var watchID;
//Hold the user's emergency contact number
var phoneNumber = "";
//Hold whether function has been run recently
var allowRun = true;
//Hold sharing options that are updated appropriately
var shareOptions;

//TODO:
//Refactoring
//File Delete
//File read involves check if still exists
    //iOS update check? eg. need to get current directory?
    //More than 10 in array? remove!
//Camera Preview
//disallow overscroll

//--- @ end
//Photoshop the notification and show example of notification sound

//Change POI icons
//offline screen
//gesture tutorial + notice about geofence
//Remaining Aesthetics (File viewer centre buttons)

document.addEventListener('deviceready', function () {
    console.log('PhoneGap Ready!');

    window.addEventListener('devicemotion', crashDetection, true);

    initNav();
}, false);

$(document).ready(function () {
    console.log("Browser Ready!");

    initNav();
});

function initNav() {
    //Initialise navbar
    $("[data-role='navbar']").navbar();
    $("[data-role='header'], [data-role='footer']" ).toolbar();
}

function crashDetection(event) {
    var gravity = 9.81; /* m per s^2 */
    var gx = event.acceleration.x / gravity;
    var gy = event.acceleration.y / gravity;
    var gz = event.acceleration.z / gravity;
    //Define threshold
    var t = 5;

    if (gx > t || gy > t || gz > t || gx < -t || gy < -t || gz < -t) {
        if (allowRun) {
            allowRun = false;

            console.log("G's:", gx, gy, gz);

            navigator.geolocation.getCurrentPosition(locationSuccess, locationFailure, {
                enableHighAccuracy: true,
                maximumAge: 5000
            });

            function locationSuccess(position) {

                var geocoder = new google.maps.Geocoder;
                var location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var address = null;

                addMarker(location.lat(), location.lng(), map);

                geocoder.geocode({ 'location': location }, function (results, status) {
                    if (status === 'OK') {
                        if (results[0]) {
                            address = results[0].formatted_address;
                        }
                    }
                    smsMessage(address);
                });
            }

            function locationFailure() {
                console.log('location failed');
                smsMessage(null);
            }

            //Ensure only a single crash per detection
            setTimeout(function () {
                allowRun = true;
            }, 5000);
        }
    }
}

function smsMessage(address) {
    var message;
    var sms = "sms:";
    
    if (address) {
        message = encodeURIComponent("I've just been in a collision near " + address +  ". Please come as soon as you can!");
    } else {
        message = encodeURIComponent("I've just been in a collision. Please contact me as soon as you can!");
    }

    if (device.platform == "Android") {
        message = "?body=" + message;
        if (phoneNumber.length > 4) {
            sms = "sms://";
        } 
    } else if (device.platform == "iOS") {
        message = "&body=" + message;
    } else {
        message = "";
    }

    if (phoneNumber) {
        console.log(sms + phoneNumber + message);
        window.location.href = sms + phoneNumber + message;
    } else {
        sms = "sms:";
        console.log(sms + message);
        window.location.href = sms + message;
    }
}

$(document).on('pageinit', '#camera', function() {

    phoneNumber = readPhoneNumberLocalStorage();
    mediaFiles = readVideoLocalStorage();

    $('#addPOI').click(function() {
        console.log('geo button pressed');

        navigator.geolocation.getCurrentPosition(locationSuccess, locationFailure, {
            enableHighAccuracy: true,
            maximumAge: 5000
        });

        function locationSuccess(position) {
            //create marker at user's position
            //if map is undefined, the marker is constructed from local storage    
            addMarker(position.coords.latitude, position.coords.longitude, map);
        }

        function locationFailure(error) {
            console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        }
    });

    $('#startRecording').click(function(event) {

        console.log('record clicked');

        navigator.device.capture.captureVideo(captureSuccess, captureFailure, {limit: 1});

        function captureSuccess(videoData) {
            var len = videoData.length;

            for (var i = 0; i < len; i++) {
                var video = {
                    name: videoData[i].name,
                    fullPath: videoData[i].fullPath,
                    lastModifiedDate: videoData[i].lastModifiedDate,
                    size: videoData[i].size,
                    type: videoData[i].type
                }
                alert(video.fullPath);
                alert(video.type);
                mediaFiles.push(video);
            }

            updateVideoLocalStorage(mediaFiles);
        }

        function captureFailure(error) {
            switch (error.code) {
                case CaptureError.CAPTURE_NO_MEDIA_FILES:
                    console.log("No videos taken");
                    break;
                case CaptureError.CAPTURE_PERMISSION_DENIED:
                    console.log("Permission Denied");
                    break;
                case CaptureError.CAPTURE_NOT_SUPPORTED:
                    console.log("Camera not supported");
                    break;
                default:
                    console.log("Internal Error");
                    break;
            }
        }
    });

    function readVideoLocalStorage() {
        var videoArray = [];

        if (localStorage && localStorage.getItem('Videos')) {
            videoArray = JSON.parse(localStorage.getItem("Videos"));

            if (window.cordova) {
                //console.log('Cordova Device');
                //Check if file exists, remove from array if not

                // for (var i = videoArray.length - 1; i >= 0; i--) {
                //     window.resolveLocalFileSystemURL(videoArray[i].fullPath,
                //         function (entry) {
                //             alert("resolved to" + entry.toURL());                            
                //             console.log('video exists');
                //         },
                //         function () {
                //             console.log('video was deleted');
                //             videoArray.splice(i, 1);
                //         }
                //     );
                // }

                // for (var i = videoArray.length - 1; i >= 0; i--) {
                //     (function (i) {

                //         var path;
                //         if (device.platform == "iOS") {
                //             path = "file://" + videoArray[i].fullPath.slice(9)
                //         } else {
                //             path = videoArray[i].fullPath;
                //         }
                //         alert(path);

                //         window.resolveLocalFileSystemURL(path,
                //             function (entry) {
                //                 alert("resolved to" + entry.toURL());                            
                //                 console.log('video exists' + i);
                //             },
                //             function () {
                //                 console.log('video was deleted' + i);
                //                 videoArray.splice(i, 1);
                //             });
                //     })(i);
                // }

            }
        }

        return videoArray;
    }

    $('#testVideoJSON').click(function() {
        getGeofences();
        //updateVideoLocalStorage(mediaFiles);
        //localStorage.setItem("Videos", '[{"name":"VID_20190420_135427.mp4","localURL":"cdvfile://localhost/sdcard/DCIM/Camera/VID_20190420_135427.mp4","type":"video/mp4","lastModified":null,"lastModifiedDate":1555764867000,"size":13294146,"start":0,"end":0,"fullPath":"file:///storage/emulated/0/DCIM/Camera/VID_20190420_135427.mp4"}, {"name":"VID_20190420_135428.mp4","localURL":"cdvfile://localhost/sdcard/DCIM/Camera/VID_20190420_135427.mp4","type":"video/mp4","lastModified":null,"lastModifiedDate":1555764867000,"size":13294146,"start":0,"end":0,"fullPath":"file:///storage/emulated/0/DCIM/Camera/VID_20190420_135427.mp4"}, {"name":"VID_20190420_135429.mp4","localURL":"cdvfile://localhost/sdcard/DCIM/Camera/VID_20190420_135427.mp4","type":"video/mp4","lastModified":null,"lastModifiedDate":1555764867000,"size":13294146,"start":0,"end":0,"fullPath":"file:///storage/emulated/0/DCIM/Camera/VID_20190420_135427.mp4"}]');
    });
});

function updateVideoLocalStorage(videoArray) {
    if (localStorage && videoArray) {
        localStorage.setItem("Videos", JSON.stringify(videoArray));
    }
}

$(document).on('pageinit', '#maps', function() {

    //Define a map
    map = new google.maps.Map(document.getElementById('gmap'), {
        mapTypeId: 'roadmap',
        center: { lat: 52.874793, lng: -1.485785 },
        zoom: 8,
        disableDefaultUI: true,
        clickableIcons: false
        }   
    );

    navigator.geolocation.getCurrentPosition(locationSuccess, locationFailure, {
        enableHighAccuracy: true,
        maximumAge: 5000
    });

    function locationSuccess(position) {
        var centre = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setZoom(11);
        map.panTo(centre);

        var icon = {
            url: "assets/icons/curr_location.png",
            scaledSize: new google.maps.Size(15, 15), 
            origin: new google.maps.Point(0, 0), 
            anchor: new google.maps.Point(7.5, 7.5) 
        };

        currentLocation = new google.maps.Marker({
            position: centre,
            map: map,
            icon: icon
        });
    }

    function locationFailure(error) {
        console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
    }
    
    //Read in markers from local storage
    if (localStorage && localStorage.getItem('POIs')) {
        var markerArray = JSON.parse(localStorage.getItem("POIs"));
        $.each(markerArray, function() {
            //ensure geofences aren't re-added
            addMarker(this.lat, this.lng, map, false);
        });
    }

    //Add markers when map is clicked
    map.addListener('click', function(position) {
        console.log('map clicked');
        addMarker(position.latLng.lat(), position.latLng.lng(), map);
    });
});

function updateMarkerLocalStorage(markerArray) {
    if (localStorage) {
        var markerInfo = [];
        $.each(markerArray, function() {
            var POI = {
                lat: this.getPosition().lat(),
                lng: this.getPosition().lng()
            }
            markerInfo.push(POI);
        });
        localStorage.setItem("POIs", JSON.stringify(markerInfo));
    }
}

function addMarker (latitude, longitude, map, singleInit = true) {
    //Custom ID for keeping track of marker
    var latLngId = latitude.toString() + longitude.toString();

    //check to see if map has been initialised
    if (map) {
        var marker = new google.maps.Marker({
            position: {lat: latitude, lng: longitude},
            map: map,
            //Custom ID for keeping track of marker
            id: latLngId
        });
    
        marker.addListener('click', function() {
            for (var i = 0; i < markers.length; i++) {
                if (markers[i].get('id') == this.get('id')) {
                    //Remove the marker from Map                  
                    this.setMap(null);
                    //Remove the marker from array
                    markers.splice(i, 1);
                    //Remove Geofence
                    removeGeofence(this.get('id'));
                    //Ensure one marker removed per click
                    break;
                }
            }
            updateMarkerLocalStorage(markers);
        });
    
        markers.push(marker);
        updateMarkerLocalStorage(markers);

    } else {
        //create a marker at position that's not assigned to a map
        var shallowMarker = new google.maps.Marker({
            position: {lat: latitude, lng: longitude},
            map: null,
            //Custom ID for keeping track of marker
            id: latLngId
        });
        //Add to array so that it can be assigned to map during local storage initialisation
        markers.push(shallowMarker);
        updateMarkerLocalStorage(markers);
        //Remove marker to avoid duplicates
        markers.pop();
    }

    //ensure that isn't called on marker group initialisation
    if (singleInit) {
        console.log("single initialisation of geofence");
        addGeofence(latLngId, latitude, longitude);
    }
}

function addGeofence(id, lat, lng) {
    if (device.platform == "Android") {
        //Dont need to initialise
        window.geofence.addOrUpdate({
            id: id,
            latitude: lat,
            longitude: lng,
            radius: 1000,
            transitionType: TransitionType.ENTER,
            notification: {
                title: "Dash Cam!",
                text: "You are getting close to a marked location. Watch out!",
                openAppOnClick: true
            }
        }).then(function() {
            console.log("Geofence success");
        },
        function (error) {
            console.log("Geofence fail", error);
        });
    }
}

function removeGeofence(id) {
    if (device.platform =="Android") {
        window.geofence.remove(id).then(
            function() {
                console.log('Geofence sucessfully removed');
            }, 
            function(error) {
                console.log('Removing geofence failed', error);
            }
        );   
    }
}

function getGeofences() {
    if (device.platform == "Android") {

        window.geofence.getWatched().then(function (geofencesJson) {
            var geofences = JSON.parse(geofencesJson);
            console.log(geofences);
        });
    }
}

$(document).on("pageshow", "#maps", function() {
    //set the height of the map to remaining space - done on pageshow for accurate height
    var navbarHeight = $("[data-role='footer']").outerHeight() - 1;
    var screenHeight = $.mobile.getScreenHeight();
    var adjustedHeight = screenHeight - navbarHeight;

    //Check to see if height needs adjusting
    if ($('#gmap').height() != adjustedHeight) {
        $('#gmap').css("height", adjustedHeight);
    }

    watchID = navigator.geolocation.watchPosition(locationSuccess, locationFailure, {
        enableHighAccuracy: true,
        maximumAge: 5000
    });

    function locationSuccess(position) {
        console.log('watching', position.coords.latitude, position.coords.longitude);
        var newLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        //check to see if current position is known and update
        if (currentLocation) {
            currentLocation.setPosition(newLocation);
        } else {
            //otherwise, create new marker on current position
            var icon = {
                url: "assets/icons/curr_location.png",
                scaledSize: new google.maps.Size(15, 15), 
                origin: new google.maps.Point(0, 0), 
                anchor: new google.maps.Point(7.5, 7.5) 
            };

            currentLocation = new google.maps.Marker({
                position: newLocation,
                map: map,
                icon: icon
            });
        }
        
    }

    function locationFailure(error) {
        console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
    }
});

$(document).on("pagehide", "#maps", function() {
    navigator.geolocation.clearWatch(watchID);
    console.log('stopped watching');
});


// Update the contents of the toolbars
$(document).on("pagecontainerchange", function () {
    console.log('pagecontainerchange');  
    
    // Get the title of the page using data-title in page div
    var current = $(".ui-page-active").jqmData("title");

    if (current == "File View") {
        $("[data-role='footer']").hide();
    } else {
        $("[data-role='footer']").show();
    }


    // Add active class to current nav button
    $("[data-role='navbar'] a").each(function () {
        if ($(this).text() === current) {
            $(this).addClass("ui-btn-active");
        }
    });
});

$(document).on('pagebeforeshow', '#files', function() {
    console.log('before files shown');

    if (localStorage && localStorage.getItem('Videos')) {
        var mediaFiles = JSON.parse(localStorage.getItem("Videos"));
    }

    var content = '';
    if (mediaFiles) {
        for (var i = 0; i < mediaFiles.length; i++) {
            var name = mediaFiles[i].name;
            var date = new Date(mediaFiles[i].lastModifiedDate);
            var filepath = mediaFiles[i].fullPath;
            var filesize = mediaFiles[i].size;
            var filetype = mediaFiles[i].type;

            console.log(name, filepath, date, filesize, filetype);

            //Convert to Megabytes
            filesize = (filesize / 1000000).toFixed(2);

            content += '<li>' +
                '<a href="#fileview" class="play-video" data-name="' + name + '" data-filepath="' + filepath + '">' +
                '<h2>' + name + '</h2>' +
                '<p>' + date + '</p>' +
                '<p>' + filesize + ' MB</p>' +
                '</a>' +
                '<a href="#" class="delete-video" data-name="' + name + '">Delete Video</a>' +
                '</li>';
        }
        console.log(content);

        $('#files_list').empty();
        $('#files_list').html(content);
        $('#files_list').listview('refresh');

        $("#files_list li .play-video").on('click', function () {
            console.log('clicked File');

            var name = $(this).data("name");
            var filepath = $(this).data("filepath");

            sessionStorage.setItem("Name", name.toString());
            sessionStorage.setItem("Filepath", filepath.toString());

        });

        $("#files_list li .delete-video").on('click', function () {
            console.log('Clicked Delete');

            var name = $(this).data("name");
            $(this).parent().remove();

            removeMediaFile(name);
        });
    }
});

//may need to change to filepath
function removeMediaFile(filename) {
    for (var i = 0; i < mediaFiles.length; i++) {
        if (mediaFiles[i].name == filename) {
            mediaFiles.splice(i, 1);
            break;
        }
    }
    updateVideoLocalStorage(mediaFiles);
}

$(document).on('pageinit', '#fileview',function() {

    if (window.cordova){
        if (device.platform == "Android") {
            //Define permission variable
            var permissions = cordova.plugins.permissions;
            //check if permission exists
            permissions.checkPermission(permissions.READ_EXTERNAL_STORAGE, success, fail);
            //permission exists
            function success() {
                //Request file read necessary to load video
                permissions.requestPermission(permissions.READ_EXTERNAL_STORAGE, 
                    function () {
                        console.log('File permission granted');
                    }, 
                    function() {
                        console.log('File permission denied');
                    });
            }
            //permission doesn't exist
            function fail() {
                console.log('permission failed');
            }
                
        }
    }

    $('#share').on('click', function() {
        if (shareOptions) {
            window.plugins.socialsharing.shareWithOptions(shareOptions,
                function (result) {
                    // On Android apps mostly return false even while it's true
                    console.log("Share completed? " + result.completed);
                    // On Android result.app since plugin version 5.4.0 this is no longer empty. On iOS it's empty when sharing is cancelled (result.completed=false)
                    console.log("Shared to app: " + result.app);
                },
                function (error) {
                    console.log("Sharing failed with message: " + error);
                }
            );
        }
    });
});


$(document).on('pageshow', '#fileview', function() {

    var name = sessionStorage.getItem("Name");
    var filepath = sessionStorage.getItem("Filepath");

    $('#header-title').text(name);
    $('video').attr("src", filepath);

    var headerHeight = $("#fileview-header").outerHeight() - 1;
    var screenHeight = $.mobile.getScreenHeight();
    var adjustedHeight = screenHeight - headerHeight;

    //Check to see if height needs adjusting
    if ($('#video').height() != adjustedHeight) {
        $('#video').css("height", adjustedHeight);
    }

    //update sharing options for current video
    shareOptions = { 
        message: 'This is a video which I recorded using Dash Cam!',
        subject: 'Saved Video from Dash Cam!',
        files: [filepath]
    };
});

$(document).on('pagehide', '#fileview', function() {

    //Get DOM element of video
    var video = document.getElementById('video');
    //Pause so that it stops playing when navigating to different page
    video.pause();
});

$(document).on('pageinit', '#info', function() {

    var clear = $('.ui-input-clear');
    clear.removeClass('ui-icon-delete').addClass('ui-icon-material-clear ui-nodisc-icon');

    if (phoneNumber) {
        $('#emergency-tel').val(phoneNumber);
    }

    $('#emergency-tel').change(function() {
        phoneNumber = $(this).val();
        
        updateContactLocalStorage(phoneNumber);
    });

    function updateContactLocalStorage(contactNumber) {
        if (localStorage) {
            localStorage.setItem("Phone", contactNumber.toString());
        }
    }
});

function readPhoneNumberLocalStorage() {
    var number = "";

    if (localStorage && localStorage.getItem("Phone")) {
        number = localStorage.getItem("Phone");
    }

    return number;
}