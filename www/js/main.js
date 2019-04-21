"use strict";

//TODO:
//stop HTML5 video playback on leaving page
//check local storage
//update maps (not to map though :))
//add aesthetics
//refactor code

//Change POI icons and decide on animation?
//offline screen
//gesture tutorial
//Move global vars to top
//check for deletion
//Camera Preview

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
        updateVideoLocalStorage(mediaFiles);
        //localStorage.setItem("Videos", '[{"name":"VID_20190420_135427.mp4","localURL":"cdvfile://localhost/sdcard/DCIM/Camera/VID_20190420_135427.mp4","type":"video/mp4","lastModified":null,"lastModifiedDate":1555764867000,"size":13294146,"start":0,"end":0,"fullPath":"file:///storage/emulated/0/DCIM/Camera/VID_20190420_135427.mp4"}, {"name":"VID_20190420_135428.mp4","localURL":"cdvfile://localhost/sdcard/DCIM/Camera/VID_20190420_135427.mp4","type":"video/mp4","lastModified":null,"lastModifiedDate":1555764867000,"size":13294146,"start":0,"end":0,"fullPath":"file:///storage/emulated/0/DCIM/Camera/VID_20190420_135427.mp4"}, {"name":"VID_20190420_135429.mp4","localURL":"cdvfile://localhost/sdcard/DCIM/Camera/VID_20190420_135427.mp4","type":"video/mp4","lastModified":null,"lastModifiedDate":1555764867000,"size":13294146,"start":0,"end":0,"fullPath":"file:///storage/emulated/0/DCIM/Camera/VID_20190420_135427.mp4"}]');
    });
});

function updateVideoLocalStorage(videoArray) {
    if (localStorage && videoArray) {
        localStorage.setItem("Videos", JSON.stringify(videoArray));
    }
}

//Global variable holding GMaps marker objects
var markers = [];
//Global variable for map so can be changed outside of page 
var map;
//Global variable for current Location so it can be updated on pageshow and stopped on close
var currentLocation;
$(document).on('pageinit', '#maps', function() {

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
    //set the height of the map to remaining space - done on pageshow for accurate height
    var navbarHeight = $("[data-role='footer']").outerHeight() - 1;
    var screenHeight = $.mobile.getScreenHeight();
    var adjustedHeight = screenHeight - navbarHeight;

    //Check to see if height needs adjusting
    if ($('#map').height() != adjustedHeight) {
        $('#map').css("height", adjustedHeight);
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

    //check if current page is file viewer, if so hide() this and remove select    
    
    // Get the title of the page using data-title in page div
    var current = $(".ui-page-active").jqmData("title");

    if (current == "File View") {
        $("[data-role='navbar']").hide();
    } else {
        $("[data-role='navbar']").show();
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

            console.log(content);
        }


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
});

//Needs to be on pageshow as the header height isn't accurate until then
$(document).on('pageshow', '#fileview', function() {

    var name = sessionStorage.getItem("Name");
    var filepath = sessionStorage.getItem("Filepath");

    $('#header-title').text(name);
    $('video').attr("src", filepath);

    var headerHeight = $("#fileview-header").outerHeight() - 1;
    var screenHeight = $.mobile.getScreenHeight();
    $('#video').css("height", screenHeight - headerHeight);

});

var phoneNumber = null;
$(document).on('pageinit', '#info', function() {

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

$(document).on('pagebeforecreate', '#info', function() {
    if (localStorage && localStorage.getItem("Phone")) {
        var phoneNumber = localStorage.getItem("Phone");

        $('#emergency-tel').val(phoneNumber);
    }
});