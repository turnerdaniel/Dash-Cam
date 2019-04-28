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

//PG Ready
document.addEventListener('deviceready', function () {
    console.log('PhoneGap Ready!');

    //Initialise elements that are needed on initial load
    window.addEventListener('devicemotion', crashDetection, true); //accelerometer
    initNav();
    initCameraPreview(); //Camera Preview
    initCameraButtons();
    $(document).on('pagebeforeshow', '#camera', initCameraPreview);
    initOfflinePage(); //Offline Detection
}, false);

//Browser Ready
$(document).ready(function () {
    console.log("Browser Ready!");

    //Initialise elements that are needed on initial load
    initNav();
    initCameraButtons();
    initOfflinePage(); ///Offline Detection
});

function initNav() {
    //Initialise navbar
    $("[data-role='navbar']").navbar();
    $("[data-role='header'], [data-role='footer']" ).toolbar();
}

function crashDetection(event) {
    //get acceleration and convert to G's
    var gravity = 9.81; /* m per s^2 */
    var gx = event.acceleration.x / gravity;
    var gy = event.acceleration.y / gravity;
    var gz = event.acceleration.z / gravity;
    //Define threshold
    var t = 5;

    //Check if threshold exceeded
    if (gx > t || gy > t || gz > t || gx < -t || gy < -t || gz < -t) {
        //only run if not performed within last 5 seconds
        if (allowRun) {
            allowRun = false;

            console.log("G's:", gx, gy, gz);

            //Get current position
            navigator.geolocation.getCurrentPosition(locationSuccess, locationFailure, {
                enableHighAccuracy: true,
                maximumAge: 5000
            });

            function locationSuccess(position) {
                var geocoder = new google.maps.Geocoder;
                var location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var address = null;

                //add marker to current location
                addMarker(location.lat(), location.lng(), map);

                //Get address from lat and long
                geocoder.geocode({ 'location': location }, function (results, status) {
                    if (status === 'OK') {
                        if (results[0]) {
                            address = results[0].formatted_address;
                        }
                    }
                    //send text message
                    smsMessage(address);
                });
            }

            function locationFailure() {
                console.log('location failed');
                //send text message without address
                smsMessage(null);
            }

            //Ensure only a single crash per detection
            setTimeout(function () {
                allowRun = true;
            }, 5000); //5s delay
        }
    }
}

function smsMessage(address) {
    var message;
    var sms = "sms:";
    
    //construct text message format depending on address and current device
    if (address) {
        message = encodeURIComponent("I've just been in a collision near " + address +  ". Please come as soon as you can!");
    } else {
        message = encodeURIComponent("I've just been in a collision. Please contact me as soon as you can!");
    }

    if (device.platform == "Android") {
        message = "?body=" + message;
        //Android doesn't allow messages to be sent to emergency numbers (n < 4)
        if (phoneNumber.length > 4) {
            sms = "sms://";
        } 
    } else if (device.platform == "iOS") {
        message = "&body=" + message;
    } else {
        message = "";
    }

    //launch the device's native SMS app
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

    //populate arrays from local storage
    phoneNumber = readPhoneNumberLocalStorage();
    mediaFiles = readVideoLocalStorage();

    //Add POI button
    $('#addPOI').click(function() {
        console.log('geo button pressed');

        //get current position
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

    //Record Button
    $('#startRecording').click(function(event) {

        console.log('record clicked');

        //launch native video capture app
        navigator.device.capture.captureVideo(captureSuccess, captureFailure, {limit: 1});

        function captureSuccess(videoData) {
            //add captured videos to array
            var len = videoData.length;
            for (var i = 0; i < len; i++) {
                var video = {
                    name: videoData[i].name,
                    fullPath: videoData[i].fullPath,
                    lastModifiedDate: videoData[i].lastModifiedDate,
                    size: videoData[i].size,
                    type: videoData[i].type
                }
                mediaFiles.push(video);
            }
            //update local storage
            updateVideoLocalStorage(mediaFiles);
        }

        //log error message if fails
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
        //Check if local storage exists and populate array
        var videoArray = [];

        if (localStorage && localStorage.getItem('Videos')) {
            videoArray = JSON.parse(localStorage.getItem("Videos"));
        }

        return videoArray;
    }
});

function updateVideoLocalStorage(videoArray) {
    //write new values to Local Storage
    if (localStorage && videoArray) {
        localStorage.setItem("Videos", JSON.stringify(videoArray));
    }
}

function initCameraPreview() {

    //The preview is behind all HTML elements
    $('body').css('background-color', 'transparent');

    var options = {
        width: window.screen.width, //fill device viewport
        height: window.screen.height,
        camera: CameraPreview.CAMERA_DIRECTION.BACK,
        toBack: true, //allows buttons in front
        tapPhoto: false, //we have media-capture instead
        tapFocus: false
    };

    //display the preview
    CameraPreview.startCamera(options);
}

function initCameraButtons() {
    //place camera buttons above navbar
    var navbarHeight = $("[data-role='footer']").outerHeight() - 1;
    
    $('#startRecording').css('bottom', navbarHeight);
    $('#addPOI').css('bottom', navbarHeight);
}

$(document).on('pagebeforehide', '#camera', function() {
    //close the camera preview and revert the background colour
    $('body').css('background-color', '#48626d');

    if (window.cordova) {
        if (device.platform == "Android" || device.platform == "iOS") {
            CameraPreview.stopCamera();
        }
    }
});

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
    
    //define the placement of the map buttons and show tutorial if required
    initMapButtons();
    initTutorial();

    //get current positon
    navigator.geolocation.getCurrentPosition(locationSuccess, locationFailure, {
        enableHighAccuracy: true,
        maximumAge: 5000
    });

    function locationSuccess(position) {
        //set a marker indicating the user's position - zoom and pan to this position
        var centre = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setZoom(11);
        map.panTo(centre);

        var icon = {
            url: "assets/img/curr_location.png",
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
    
    //Read in markers from local storage and add to map
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

    $('#my-location').click(function() {
        //pan camera to current location when my location button clicked
        if (currentLocation) {
            map.setZoom(11);
            map.panTo(currentLocation.position);
        }
    });
});

function initMapButtons() {
    //place my location button above navbar
    var navbarHeight = $("[data-role='footer']").outerHeight() - 1;
    $('#my-location').css('bottom', navbarHeight);
}

function initTutorial() {
    //read local storage to see if tutorial has been accepted before
    if (localStorage && localStorage.getItem('Tutorial')) {
        var needShow = localStorage.getItem('Tutorial');
        //display tutorial screen on first visit
        if (needShow == "true") {
            $('#tutorial').show();
        }
    } else {
        $('#tutorial').show();
    }

    //update local storage to prevent tutorial from being shown again 
    $('#tutorial-okay').click(function() {
        $('#tutorial').fadeOut('fast');

        if(localStorage) {
            localStorage.setItem('Tutorial', "false");
        }
    });
}

//create event listeners to see when device network status changes
function initOfflinePage() {
    //display the offline notice when offline
    $(document).on('offline', function() {
        $('#offline-notice').fadeIn('fast');
    });
    //hide the offline notice when online
    $(document).on('online', function() {
        $('#offline-notice').fadeOut('fast');
    });
}

//write markers that are currently being displayed to local storage
function updateMarkerLocalStorage(markerArray) {
    //check if local storage is available
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
        
        //allows markers to be removed when clicked on
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

    //ensure that isn't called on marker group initialisation as causes performance issues
    if (singleInit) {
        console.log("single initialisation of geofence");
        addGeofence(latLngId, latitude, longitude);
    }
}

function addGeofence(id, lat, lng) {
    //need to check if Android since only works on those devices
    if (window.cordova) {
        if (device.platform == "Android") {
            //Add a geofence that triggers a notification when entered
            window.geofence.addOrUpdate({
                id: id, //uses ID from markers
                latitude: lat,
                longitude: lng,
                radius: 1000,
                transitionType: TransitionType.ENTER,
                notification: {
                    title: "Dash Cam!",
                    text: "You are getting close to a marked location. Watch out!",
                    openAppOnClick: true
                }
            }).then(function () {
                console.log("Geofence success");
            },
                function (error) {
                    console.log("Geofence fail", error);
                });
        }
    }
}

function removeGeofence(id) {
    //check if device is android
    if (window.cordova) {
        if (device.platform == "Android") {
            //Remove geofence with matching ID
            window.geofence.remove(id).then(
                function () {
                    console.log('Geofence sucessfully removed');
                },
                function (error) {
                    console.log('Removing geofence failed', error);
                }
            );
        }
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

    //get current position and watch for updates
    watchID = navigator.geolocation.watchPosition(locationSuccess, locationFailure, {
        enableHighAccuracy: true,
        maximumAge: 5000
    });

    //called on each position update
    function locationSuccess(position) {
        console.log('watching', position.coords.latitude, position.coords.longitude);
        var newLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        //check to see if current position is known and update
        if (currentLocation) {
            //update user's position on map
            currentLocation.setPosition(newLocation);
        } else {
            //otherwise, create new marker on current position with custom icon
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

    //log any errors
    function locationFailure(error) {
        console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
    }
});

$(document).on("pagehide", "#maps", function() {
    //stop recieving updates when page is closed to preserve battery
    navigator.geolocation.clearWatch(watchID);
    console.log('stopped watching');
});

// Update the contents of the toolbars when page changes
$(document).on("pagecontainerchange", function () {
    console.log('pagecontainerchange');  
    
    // Get the title of the page using data-title in page div
    var current = $(".ui-page-active").jqmData("title");

    //Hide the nav bar on the file view page
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

    //read all the captured files from local storage
    if (localStorage && localStorage.getItem('Videos')) {
        mediaFiles = JSON.parse(localStorage.getItem("Videos"));

        //Remove files over the limit of 10 to preserve storage space
        checkNumberOfFiles();
    }

    //display message if there are no files to show
    displayEmptyMessage();

    //create list view content made up of recorded files
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
            
            //HTML to be displayed
            content += '<li>' +
                '<a href="#fileview" class="play-video" data-name="' + name + '" data-filepath="' + filepath + '">' +
                '<h2>' + name + '</h2>' +
                '<p>' + date + '</p>' +
                '<p>' + filesize + ' MB</p>' +
                '</a>' +
                '<a href="#" class="delete-video" data-name="' + name + '" data-filepath="' + filepath + '">Delete Video</a>' +
                '</li>';
        }
        console.log(content);

        //update the content of the list view
        $('#files_list').empty();
        $('#files_list').html(content);
        $('#files_list').listview('refresh');

        //on file being clicked
        $("#files_list li .play-video").on('click', function () {
            console.log('Clicked File');

            var name = $(this).data("name");
            var path = $(this).data("filepath");
            //store the file name and path temporarily for access by file view page
            sessionStorage.setItem("Name", name.toString());
            sessionStorage.setItem("Filepath", path.toString());
        });

        //on delete being clicked
        $("#files_list li .delete-video").on('click', function () {
            console.log('Clicked Delete');

            var name = $(this).data("name");
            var path = $(this).data("filepath");
            $(this).parent().remove();

            //delete file from the device
            deleteFile(path);
            //remove file from array
            removeMediaFile(name);
            //check to see if empty message needs to be shown
            displayEmptyMessage();
        });
    }
});

function removeMediaFile(filename) {
    //remove mediafiles from array that match the provided name
    for (var i = 0; i < mediaFiles.length; i++) {
        if (mediaFiles[i].name == filename) {
            mediaFiles.splice(i, 1);
            break;
        }
    }
    updateVideoLocalStorage(mediaFiles);
}

//delete file from device
function deleteFile(filepath) {
    //Add file:// to iOS filepaths
    if (filepath.substring(0, 7) != "file://") {
        filepath = "file://" + filepath;
    }

    //prevent error in browser
    if (window.cordova) {
        //get a file object that can operations performed on them
        window.resolveLocalFileSystemURL(filepath, function (file) {
            if (device.platform == "Android") {
                //request permisions if necessary on Android
                var permissions = cordova.plugins.permissions;
                permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE, function () {
                    console.log('File write permission granted');
                    //delete the file
                    del(file);
                },
                    function () {
                        console.log('File write permission denied');
                    }
                );
            } else {
                //other OS's: just delete the file
                del(file);
            }
        },
            function (error) {
                console.log("Couldn't resolve File", error);
            }
        );
    }
    
    //performs deletion operation on file object
    function del(fileObj) {
        fileObj.remove(function() {
            console.log("File removed");
        },
        function(error) {
            console.log("Couldn't remove file", error);
        });
    }
}

//removes old files to preserve storage space
function checkNumberOfFiles() {
    if (mediaFiles) {
        var maxLength = 10;
        if (mediaFiles.length > maxLength) {
            console.log("More than 10 Videos.");

            var start = mediaFiles.length - (maxLength + 1);                
            
            //loop through files exceeding threshold
            for (var i = start; i >= 0; i--) {
                var name = mediaFiles[i].name;
                var filename = mediaFiles[i].fullPath;

                console.log("Deleting: ", mediaFiles[i]);
                //delete and remove from array
                deleteFile(filename);
                removeMediaFile(name);
            }
        }
    }
}


function displayEmptyMessage() {
    //displays empty message if there are no files to show
    if (mediaFiles) {
        if (mediaFiles.length == 0) {
            $('#message-container').fadeIn('fast');
        } else {
            $('#message-container').hide();
        }
    } else {
        $('#message-container').show();
    }
}

$(document).on('pageinit', '#fileview',function() {

    //check if android - Need to gain access to external storage to show video
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
        //Display native share menu for the associated file
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

    //get the name and path to vide from session storage
    var name = sessionStorage.getItem("Name");
    var filepath = sessionStorage.getItem("Filepath");
    //set the name and filepath of video in HTML
    $('#header-title').text(name);
    $('video').attr("src", filepath);
    //set the video to full size of the screen 
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

    //define custom clear icon for text box
    var clear = $('.ui-input-clear');
    clear.removeClass('ui-icon-delete').addClass('ui-icon-material-clear ui-nodisc-icon');

    //check to see if phone number has been set, update if so
    if (phoneNumber) {
        $('#emergency-tel').val(phoneNumber);
    }

    //Executed when the user updates their phone number 
    $('#emergency-tel').change(function() {
        //reflect update in new variable and local storage
        phoneNumber = $(this).val();
        
        updateContactLocalStorage(phoneNumber);
    });

    function updateContactLocalStorage(contactNumber) {
        //update local storage if available
        if (localStorage) {
            localStorage.setItem("Phone", contactNumber.toString());
        }
    }
});

function readPhoneNumberLocalStorage() {
    //Get the number from local storage if it has been defined before
    var number = "";
    if (localStorage && localStorage.getItem("Phone")) {
        number = localStorage.getItem("Phone");
    }
    return number;
}