mapboxgl.accessToken = 'pk.eyJ1Ijoia3ZubHh1IiwiYSI6ImNqdW1ncnJwMzBud2YzeXFxbXR0aWdzeTAifQ.RUQHfqJwiOAsflFX_hx2lQ';

function epochSeconds(){
    return Math.floor( Date.now() / 1000 );
}

function lastMonthUTX(){
    let currentTime = epochSeconds();
    return currentTime - 2629743;
}

function epochToLocal(epochTime){
    return new Date(epochTime * 1000);
}

function incidentListItem(title, address, occurred_at, type, description, link){
    var li =  
    `<li>
        <h2>${title}</h2>
        <p>Location: ${address}</p>
        <p>Time of Incident: ${occurred_at}</p>
        <p>Type: ${type}</p>
        <p>Description: ${description}</p>
        <a href=${link}>Link</a>
    </li>`;
    return li;
}

function displayIncidentList(responseJson) {
    $('#incident-list').empty();
    var numIncidents = responseJson.incidents.length;
    for(var i = 0; i < numIncidents; i++){
        var incident = responseJson.incidents[i];
        var title = incident.title;
        var address = incident.address;
        var occurred_at = epochToLocal(incident.occurred_at);
        var type = incident.type;
        var description = incident.description;
        var link = incident.source.html_url;
        $('#incident-list').append(incidentListItem(title, address, occurred_at, type, description, link));
    }
    $('#incident-list-view').removeClass('hidden');
}

function displayIncidents(responseJson) {
    var numIncidents = responseJson.incidents.length;
    var mostCommonType;
    var mostCommonCount = 0;
    var incidentCounter = {};
    for(var i = 0; i < numIncidents; i++){
        var incidentType = responseJson.incidents[i]['type'];
        if(incidentCounter[incidentType] == null) {
            incidentCounter[incidentType] = 1;
        } else {
            incidentCounter[incidentType]++;
        }
        if(incidentCounter[incidentType] > mostCommonCount) {
            mostCommonType = incidentType;
            mostCommonCount = incidentCounter[incidentType];
        }
    }
    $('#incident-count').empty();
    $('#incident-count').append(
        `<p>There have been ${numIncidents} incidents reported near this location in the past 30 days.</p>`
    )
    if(mostCommonType){
        $('#incident-count').append(
            `<p>
                ${mostCommonCount} of the reported incidents last month are ${mostCommonType.toLowerCase()}.
            </p>`
        )
    }

    $('#incident-count').removeClass('hidden');
    displayIncidentList(responseJson);
}

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function getIncidents(location) {
    let params = {
        occurred_after: lastMonthUTX(),
        proximity: location,
        proximity_square: 10
    };

    let queryString = formatQueryParams(params);

    let url = "https://bikewise.org:443/api/v2/incidents?" + queryString;

    fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => displayIncidents(responseJson))
    .catch(err => {
      $('#error-text').text(`Something went wrong: ${err.message}`);
    });
}

function renderMap(responseJson){
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: responseJson.features[0].geometry.coordinates,
        zoom: 11
    });

    var geojson = responseJson;  
    
    geojson.features.forEach(function(marker) {

        // create a HTML element for each feature
        var el = document.createElement('div');
        el.className = 'marker';
      
        // make a marker for each feature and add to the map
        new mapboxgl.Marker(el)
          .setLngLat(marker.geometry.coordinates)
          .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
          .setHTML('<h3>' + marker.properties.title + '</h3><p>' + marker.properties.description + '</p>'))
          .addTo(map);
    });

    $('#map').removeClass('hidden');
    map.resize();
}

function mapIncidents(location){
    let params = {
        occurred_after: lastMonthUTX(),
        proximity: location,
        proximity_square: 10
    };

    let queryString = formatQueryParams(params);

    let url = "https://bikewise.org:443/api/v2/locations/markers?" + queryString;

    fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => renderMap(responseJson))
    .catch(err => {
      $('#error-text').text(`Something went wrong: ${err.message}`);
    });
}

function initializeApp(){
    $('#js-form').submit(event => {
        event.preventDefault();
        let location = $('#js-location').val();
        getIncidents(location);
        mapIncidents(location);
    });
}

$(initializeApp);