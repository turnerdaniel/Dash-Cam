"use strict";

//TODO:
//Implement Local Storage for videos & check for deletion
//Then, need to passing videos and playing them

//Change POI icons and decide on animation?
//offline screen
//gesture tutorial
//Move global vars to top

document.addEventListener('deviceready', function () {
    console.log('PhoneGap Ready!');

    // window.addEventListener('devicemotion', function (event) {
    //     console.log(event.acceleration.x);
    //     console.log(event.acceleration.y);
    //     console.log(event.acceleration.z);
    // }, true);

    //Can send sms using sms://00000000&body=message - may need investigation for android

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

var mediaFiles = [];
$(document).on('pageinit', '#camera', function() {

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

            // if (window.cordova) {}
            //Check if file exists, remove from array if not
            // for (var i = 0; i < videoArray.length; i++) {
            //     window.resolveLocalFileSystemURL(videoArray[i].fullPath,
            //         function () {
            //             console.log('video exists');
            //         },
            //         function () {
            //             console.log('video was deleted');
            //             videoArray.splice(i, 1);
            //         }
            //     );
            // }
        }

        return videoArray;
    }

    function updateVideoLocalStorage(videoArray) {
        if (localStorage) {
            localStorage.setItem("Videos", JSON.stringify(videoArray));
        }
    }

    $('#testVideoJSON').click(function() {
        updateVideoLocalStorage(mediaFiles);
        //localStorage.setItem("Videos", '[{"name":"VID_20190420_135427.mp4","localURL":"cdvfile://localhost/sdcard/DCIM/Camera/VID_20190420_135427.mp4","type":"video/mp4","lastModified":null,"lastModifiedDate":1555764867000,"size":13294146,"start":0,"end":0,"fullPath":"file:///storage/emulated/0/DCIM/Camera/VID_20190420_135427.mp4"}, {"name":"VID_20190420_135428.mp4","localURL":"cdvfile://localhost/sdcard/DCIM/Camera/VID_20190420_135427.mp4","type":"video/mp4","lastModified":null,"lastModifiedDate":1555764867000,"size":13294146,"start":0,"end":0,"fullPath":"file:///storage/emulated/0/DCIM/Camera/VID_20190420_135427.mp4"}, {"name":"VID_20190420_135429.mp4","localURL":"cdvfile://localhost/sdcard/DCIM/Camera/VID_20190420_135427.mp4","type":"video/mp4","lastModified":null,"lastModifiedDate":1555764867000,"size":13294146,"start":0,"end":0,"fullPath":"file:///storage/emulated/0/DCIM/Camera/VID_20190420_135427.mp4"}]');
    });
});

//Global variable holding GMaps marker objects
var markers = [];
//Global variable for map so can be changed outside of page 
var map;
//Global variable for current Location so it can be updated on pageshow and stopped on close
var currentLocation;
$(document).on('pageinit', '#maps', function() {
    //set the height of the map to remaining space
    var navbarHeight = $("[data-role='footer']").outerHeight() - 1;
    var screenHeight = $.mobile.getScreenHeight();
    $('#map').css("height", screenHeight - navbarHeight);

    //Define a map
    map = new google.maps.Map(document.getElementById('map'), {
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
            addMarker(this.lat, this.lng, map);
        });
    }

    //Add markers when map is clicked
    map.addListener('click', function(position) {
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

function addMarker (latitude, longitude, map) {
    //check to see if map has been initialised
    if (map) {
        var marker = new google.maps.Marker({
            position: {lat: latitude, lng: longitude},
            map: map,
            //Custom ID for keeping track of marker
            id: latitude.toString() + longitude.toString()
        });
    
        marker.addListener('click', function() {
            for (var i = 0; i < markers.length; i++) {
                if (markers[i].get('id') == this.get('id')) {
                    //Remove the marker from Map                  
                    this.setMap(null);
                    //Remove the marker from array
                    markers.splice(i, 1);
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
            map: null
        });
        //Add to array so that it can be assigned to map during local storage initialisation
        markers.push(shallowMarker);
        updateMarkerLocalStorage(markers);
        //Remove marker to avoid duplicates
        markers.pop();
    }
    
}

var watchID;
$(document).on("pageshow", "#maps", function() {
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
        //var videoArray = JSON.parse(localStorage.getItem("Videos"));
    }

    var content = '';

    for (var i = 0; i < mediaFiles.length; i++) {
        var name = mediaFiles[i].name;
        var date = new Date(mediaFiles[i].lastModifiedDate);
        var filepath = mediaFiles[i].fullPath;
        var filesize = mediaFiles[i].size;
        var filetype = mediaFiles[i].type;

        console.log(name, filepath, date, filesize, filetype);
        
        //Convert to Megabytes
        filesize = (filesize / 1000000).toFixed(2);

        content +=  '<li>' + 
                        '<a href="#fileview">' +
                            '<h2>' + name + '</h2>' +
                            '<p>' + date + '</p>' +
                            '<p>' + filesize + ' MB</p>' +
                        '</a>' +
                        '<a href="#">Delete Video</a>' +
                    '</li>';

        console.log(content);
    }
    
    $('#files_list').empty();
    $('#files_list').html(content);
    $('#files_list').listview('refresh');

    $("#files_list li a").on('click', function() {
        console.log('clicked File');

        //update list here and on page load
    })
});