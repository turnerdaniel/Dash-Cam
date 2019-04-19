"use strict";

//TODO:
//Change POI icons and decide on animation?
//offline screen
//gesture tutorial
//test on iOS

document.addEventListener('deviceready', function () {
    console.log('PhoneGap Ready!');

    // window.addEventListener('devicemotion', function (event) {
    //     console.log(event.acceleration.x);
    //     console.log(event.acceleration.y);
    //     console.log(event.acceleration.z);
    // }, true);

    //Can send sms using sms://00000000&body=message - may need investigation for android

    init();

    initCamera();
}, false);

$(document).ready(function () {
    console.log("Browser Ready!");

    init();

    initCamera();
});

function init() {
    //Initialise navbar
    $("[data-role='navbar']").navbar();
    $("[data-role='header'], [data-role='footer']" ).toolbar();
}

function initCamera() {
    $('#addPOI').click(function() {
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
}

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

function updateLocalStorage(markerArray) {
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
            updateLocalStorage(markers);
        });
    
        markers.push(marker);
        updateLocalStorage(markers);

    } else {
        //create a marker at position that's not assigned to a map
        var shallowMarker = new google.maps.Marker({
            position: {lat: latitude, lng: longitude},
            map: null
        });
        //Add to array so that it can be assigned to map during local storage initialisation
        markers.push(shallowMarker);
        updateLocalStorage(markers);
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
        currentLocation.setPosition(newLocation);
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

$(document).on('pagecreate', '#files', function() {

    $("#files_list li a").on('click', function() {
        console.log('clicked File');
    })
});