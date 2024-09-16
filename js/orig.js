const {MapboxOverlay} = deck;

    // Get a mapbox API access token
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2VyeXNsZXdpcyIsImEiOiJjbHllbHc0c24wM2V4MnJzYjd6d3NhcDQ5In0.NqG44ctju4Fm25dTP8GqZQ';

    // Initialize mapbox map
    const map = new mapboxgl.Map({
        style: 'mapbox://styles/mapbox/dark-v11',
        // style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [-1.833550, 52.456540],
        zoom: 16,
        pitch: 45,
        bearing: -17.6,
        container: 'map',
        antialias: true

    });

    const draw = new MapboxDraw({
        displayControlsDefault: true,
        // Select which mapbox-gl-draw control buttons to add to the map.
        controls: {
            polygon: true,
            trash: true
        },
        // Set mapbox-gl-draw to draw by default.
        // The user does not have to click the polygon control button first.
        defaultMode: 'draw_polygon'
    });

    map.addControl(draw);

    map.on('draw.create', updateArea);
    map.on('draw.delete', updateArea);
    map.on('draw.update', updateArea);

    function updateArea(e) {
        alert("updating info for polygon");

        const data = draw.getAll();
        const polygonData = data.features[0].geometry.coordinates[0];
        console.log("Boundary polygon points:" + JSON.stringify(polygonData));
        const searchWithin = turf.polygon([polygonData]);
        console.log("searchWithin: "+ searchWithin);
        const answer = document.getElementById('calculated-area');

        const epcRenderedFeatures = map.queryRenderedFeatures({
            layers: ['epc-layer']
        });
        console.log("epc rendered data found: " + JSON.stringify(epcRenderedFeatures));

        const epcSourceFeatures = map.querySourceFeatures('epc', {
             'sourceLayer': 'epc-layer'
        });
        // console.log("epc source data found: " + JSON.stringify(epcSourceFeatures));

        var featureSet = epcRenderedFeatures;

        if (!featureSet.length) { // this is the number of features loaded on the screen and affected by zoom
            console.log("no epc data found");
            return;
        }else{
            console.log("epcRenderedFeatures length: "+featureSet.length)
            // console.log("epc data found: " + JSON.stringify(featureSet[0]['geometry']['coordinates']));
        }

        var foundFeatures = 0;
        var foundFeatureCoords = "";

        for(var i=0;i<featureSet.length;i++){

            var epcObj = featureSet[i];

            if( epcObj['properties']['current-energy-efficiency'] != null ){
                var polygon = turf.polygon(epcObj['geometry']['coordinates']);
                var point = turf.point(polygon['geometry']['coordinates'][0][0]);
                console.log("polygon built: "+ JSON.stringify(polygon));
                console.log("polygon point data: "+ polygon['geometry']['coordinates'][0][0]);
                console.log("point: "+ point);
                pointsInside = turf.pointsWithinPolygon(point, searchWithin);

                if (!pointsInside) {
                    return;
                }else{
                    foundFeatures++;
                    foundFeatureCoords += "|"+polygon['geometry']['coordinates'][0][0]+"|\n\n";
                }

            }

        }
        alert("found " + foundFeatures + " features inside boundary");
        alert("foundFeatureCoords: \n\n" + foundFeatureCoords + "");

        if (data.features.length > 0) {
            const area = turf.area(data);
            // Restrict the area to 2 decimal points.
            const rounded_area = Math.round(area * 100) / 100;
            answer.innerHTML = `<p><strong>${rounded_area}</strong></p><p>square meters</p>`;
            // if(epcdata){
            //     var inside = turf.pointsWithinPolygon(polyCoord, epcdata);
            //     alert (inside);
            // }
            if (map.getSource('epc-layer') && map.isSourceLoaded('epc-layer')) {
                // alert("epcdata available");
            }
        } else {
            answer.innerHTML = '';
            if (e.type !== 'draw.delete')
                alert('Click the map to draw a polygon.');
        }

    }

    const mapDiv = document.getElementById('map');
    mapDiv.appendChild(document.getElementById("control-panel"));
    mapDiv.appendChild(document.getElementById("menu"));
    mapDiv.appendChild(document.getElementById("loader"));
    const menuDiv = document.getElementById('menu');
    // mapDiv.appendChild(document.getElementById("calculation-box"));


    const layerList = document.getElementById('menu');
    const inputs = layerList.getElementsByTagName('input');

    for (const input of inputs) {
        input.onclick = (layer) => {
            const layerId = layer.target.id;
            map.setStyle('mapbox://styles/mapbox/' + layerId);
        };
    }

    map.on('style.load', () => {
        // Insert the layer beneath any symbol layer.
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
        ).id;

        // The 'building' layer in the Mapbox Streets
        // vector tileset contains building height data
        // from OpenStreetMap.
        map.addLayer(
            {
                'id': 'add-3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                    'fill-extrusion-color': '#e8f3f7',

                    // Use an 'interpolate' expression to
                    // add a smooth transition effect to
                    // the buildings as the user zooms in.
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        15.05,
                        ['get', 'height']
                    ],
                    'fill-extrusion-base': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        15.05,
                        ['get', 'min_height']
                    ],
                    'fill-extrusion-opacity': 0.85
                }
            },
            labelLayerId
        );
    });

    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());
    // Add fullscreen option
    map.addControl(new mapboxgl.FullscreenControl());

    map.on('styledata', () => {
        map.addSource('epc', {
        type: 'geojson',
        // Use a URL for the value for the `data` property.
        data: 'http://127.0.0.1:8000/static/js/wmca_epc_data.geojson'
    });

    map.addLayer({
        'id': 'epc-layer',
        'source': 'epc',
        'type': 'fill-extrusion',
        'paint': {
        //'fill-extrusion-color': '#52be80',
        'fill-extrusion-color': {
            property: 'current-energy-efficiency',
            stops: [[0, '#d4340d'], [21, '#f18421'], [38, '#f8b368'], [55, '#f0c713'], [69, '#8cc637'], [81, '#1bb359'], [92, '#02895d']]
        },
        'fill-extrusion-height': 15,
        'fill-extrusion-opacity': 0.8,
        },
    });


    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', 'epc-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'epc-layer', () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('click', 'epc-layer', (e) => {

        const features = e.features[0];

        // Copy coordinates array
        const coordinates = features['geometry']['coordinates'];

        if(features['properties']['current-energy-efficiency']) {
            msg = '' + features['properties']['current-energy-efficiency'];
        }else{
            msg = 'n/a';
        }
        if(features['properties']['potential-energy-efficiency']) {
            msg2 = '' + features['properties']['potential-energy-efficiency'];
        }else{
            msg2 = 'n/a';
        }
        // console.log(msg);
        const currentEfficiency = features['properties']['current-energy-efficiency'];
        const potentialEfficiency = features['properties']['potential-energy-efficiency'];

        document.getElementById('cur-eff').innerHTML = msg;
        document.getElementById('cur-eff').setAttribute('data-color', currentEfficiency);
        document.getElementById('pot-eff').innerHTML = msg2;
        document.getElementById('pot-eff').setAttribute('data-color', potentialEfficiency);

        var popup = new mapboxgl.Popup({ offset: [0, -15] })
            .setLngLat(coordinates)
            .setHTML('<h3>EPC Info</h3><p>' + msg + '</p>')
            .addTo(map);

    });

        stopSpinner = (e) => {
            console.log('stop spinner')
            document.getElementById("loader").style.visibility = "hidden";
            map.off('idle', stopSpinner)
        }

        map.on('styledata', () => {
            document.getElementById("loader").style.visibility = "visible";
            map.on('idle', stopSpinner);
        });
    });
        $(document).ready(function(){

            var mc = {
                '0-20'    : 'epc_g',
                '21-37'   : 'epc_f',
                '38-54'   : 'epc_e',
                '55-68'   : 'epc_d',
                '69-80'   : 'epc_c',
                '81-91'   : 'epc_b',
                '92-100'  : 'epc_a'
            };

            function between(x, min, max) {
                return x >= min && x <= max;
            }

            var dc;
            var first;
            var second;
            var th;

            $("#control-panel div span").on('DOMSubtreeModified', function () {

                th = $(this);

                dc = parseInt($(this).attr('data-color'),10);

                $.each(mc, function(name, value){

                    first = parseInt(name.split('-')[0],10);
                    second = parseInt(name.split('-')[1],10);

                    console.log(between(dc, first, second));

                    if( between(dc, first, second) ){
                        th.attr('class', '');
                        th.addClass(value);
                    }

                });

            });
        });
