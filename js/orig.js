
    const {MapboxOverlay} = deck;

    // Get a mapbox API access token
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2VyeXNsZXdpcyIsImEiOiJjbHllbHc0c24wM2V4MnJzYjd6d3NhcDQ5In0.NqG44ctju4Fm25dTP8GqZQ';

    // Initialize mapbox map
    const map = new mapboxgl.Map({
        style: 'mapbox://styles/mapbox/dark-v11',
        // style: 'mapbox://styles/mapbox/satellite-streets-v12',
//        center: [-1.833550, 52.456540],
        center: [-1.8802233550562848, 52.46858250430878],
        zoom: 16,
        pitch: 45,
        bearing: -17.6,
        container: 'map',
        antialias: true

    });
    map.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,

    // Limit seach results to the UK.
            countries: 'gb',
    // Use a bounding box to further limit results
    // to the geographic bounds representing East Birmingham
            bbox: [-1.9285,52.4604,-1.8557,52.4952],
            mapboxgl: mapboxgl
        })
    );

    const draw = new MapboxDraw({
        displayControlsDefault: false,
        // boxSelect: true,
        controls: {
            polygon: true,
            trash: true
        },
        // Set mapbox-gl-draw to draw by default.
        // The user does not have to click the polygon control button first.
        // defaultMode: 'draw_polygon'
    });

    map.addControl(draw, 'top-right');

    map.on('draw.create', updateArea);
    // map.on('draw.delete', updateArea);
    map.on('draw.update', updateArea);


    function foundLassoFeatures(fpolygonsArr){
        console.log('fpolygonsArr passed to foundLassoFeatures: '+ fpolygonsArr);
        var fc = turf.featureCollection(fpolygonsArr);
        console.log('fc: '+ JSON.stringify(fc));
        if(map.getLayer('found-layer')){
            map.removeLayer('found-layer');
            console.log('found-layer has been removed');
        }

        if(map.getSource('found')){
            map.getSource('found').setData({
                type: 'geojson',
                data: fc
            });
        }else{
            map.addSource('found', {
                type: 'geojson',
                data: fc
            });
        }

        // Add a new layer to visualize the polygon.
        map.addLayer({
            'id': 'found-layer',
            'type': 'fill-extrusion',
            'source': 'found', // reference the data source
            'paint': {
                'fill-extrusion-color': '#053ef7',
                'fill-extrusion-height': 20,
                'fill-extrusion-opacity': 0.8,
            }
        });

        //alert("added found features layer");
    }

    function isPointInPolygon(point, polygon) {
        const [x, y] = point;
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];

            const intersect = ((yi > y) !== (yj > y)) &&
                            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    function updateArea(e) {
        alert("updating info for lasso");

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
        var foundFeatureUprns = "";
        var foundFeaturePolygons = [];
        var totalEPC = 0;
        var totalPotentialEPC = 0;

        for(var i=0;i<featureSet.length;i++){

            var epcObj = featureSet[i];

            if( epcObj['properties']['current-energy-efficiency'] != null ){
                //var lasso_polygon = searchWithin;

                var point_data = epcObj['geometry']['coordinates'][0][0];
                console.log("point_data:" + point_data);

                var pntInPolygon = isPointInPolygon(point_data, polygonData);
                console.log("pntInPolygon (" + point_data + "): "+ pntInPolygon);
                console.log("epcObj['geometry']['coordinates'][0]:" + epcObj['geometry']['coordinates'][0]);

                if(pntInPolygon) {
                    foundFeatures++;
                    var featObj = epcObj;
                    foundFeaturePolygons.push(featObj);
                    foundFeatureUprns += epcObj['properties'].UPRN+"\n";
                    totalEPC += parseInt(epcObj['properties']['current-energy-efficiency']);
                    totalPotentialEPC += parseInt(epcObj['properties']['potential-energy-efficiency']);
                }else {
                    var featureType = epcObj['geometry']['type'];
                    console.log("Feature UPRN: "+ epcObj['properties'].UPRN + "("+featureType+") not inside boundary");
                }

            }

        }
        alert("found " + foundFeatures + " features inside boundary");
        var round = Math.round;
        var averageEfficiency = round(totalEPC / foundFeatures);
        var potentialEfficiency = round(totalPotentialEPC / foundFeatures);
        var fpolygonsArr = JSON.stringify(foundFeaturePolygons);
        //var strungFpolygonsArr = JSON.stringify(fpolygonsArr);
        //console.log("fpolygonsArr: " + strungFpolygonsArr.substring(1,strungFpolygonsArr.length-1));
        if(foundFeatures > 0){
            document.getElementById('avg-eff').innerHTML = averageEfficiency;
            document.getElementById('avg-eff').setAttribute('data-color', averageEfficiency);
            document.getElementById('avg-pot-eff').innerHTML = potentialEfficiency;
            document.getElementById('avg-pot-eff').setAttribute('data-color', potentialEfficiency);

        }
        // foundLassoFeatures(foundFeaturePolygons);
        foundLassoFeatures(foundFeaturePolygons);
        //alert("polygonData: "+polygonData+"\n\nfoundFeatureUprns: \n\n" + foundFeatureUprns + "");
        alert("Found Feature Uprns: \n\n" + foundFeatureUprns + "");

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
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    // Add fullscreen option
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.on('styledata', () => {
        map.addSource('epc', {
        type: 'geojson',
        // Use a URL for the value for the `data` property.
        data: 'https://bear-rsg.github.io/diatomic/js/wmca_epc_data.geojson'
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

    //const epcSrcFeatures = map.querySourceFeatures('epc', {filter: ["==", "72", e.features[0].properties.current-energy-efficiency]});
    //console.log("epc source data found: " + JSON.stringify(epcSrcFeatures));

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
        console.log("features(all): "+ JSON.stringify(features));

        // Copy coordinates array
        const coordinates = features.geometry.coordinates;
        console.log("coordinates: "+ coordinates);

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
        if(features['properties']['UPRN']) {
            msg3 = '' + features['properties']['UPRN'];
        }else{
            msg3 = 'n/a';
        }


        if(coordinates != null){
            var coord_feature = coordinates;
            msg4_all = '' + coord_feature;
            msg4_arr = msg4_all.split(',');
            //for(var i = 0; i < 2; i++) {
             //  msg4_arr[i] = msg4_arr[i].replace(/^\s*/, "").replace(/\s*$/, "");
               msg4 = "\n";
               msg4 += msg4_arr[0]+"\n";
               msg4 += msg4_arr[1]+"\n";
            //}
        }else{
            msg4 = 'n/a';

        }
        // console.log(msg);
        const currentEfficiency = features['properties']['current-energy-efficiency'];
        const potentialEfficiency = features['properties']['potential-energy-efficiency'];

        document.getElementById('cur-eff').innerHTML = msg;
        document.getElementById('cur-eff').setAttribute('data-color', currentEfficiency);
        document.getElementById('pot-eff').innerHTML = msg2;
        document.getElementById('pot-eff').setAttribute('data-color', potentialEfficiency);
        document.getElementById('uprn').innerHTML = msg3;


        /* var popup = new mapboxgl.Popup({ offset: [0, -15] })
            .setLngLat(coordinates)
            .setHTML('<h3>EPC Info</h3><p>' + msg + '</p>')
            .addTo(map);
        */
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

        map.on('idle', (e) => {
            const data = [
                {x: 30, y: 10},
                {x: 50, y: 20},
                {x: 70, y: 70},
                {x: 80, y: 80},
                {x: 90, y: 10}
            ];

            const bgroundColour = [];
            const labelValues = [];
            for(i=0; i < data.length; i++) {
                if(data[i].x >=0 && data[i].x <= 20) { bgroundColour.push('hsl(357,82%,53%)') }
                if(data[i].x >=21 && data[i].x <= 38) { bgroundColour.push('hsl(20,87%,56%)') }
                if(data[i].x >=39 && data[i].x <= 54) { bgroundColour.push('hsl(38,91%,59%)') }
                if(data[i].x >=55 && data[i].x <= 68) { bgroundColour.push('hsl(58,87%,58%)') }
                if(data[i].x >=69 && data[i].x <= 80) { bgroundColour.push('hsl(87,53%,56%)') }
                if(data[i].x >=81 && data[i].x <= 91) { bgroundColour.push('hsl(150,86%,28%)') }
                if(data[i].x >=92 && data[i].x <= 100) { bgroundColour.push('hsl(214,45%,49%)') }
                labelValues.push(data[i].x)
            }
            console.log(labelValues)

            var ctx = document.getElementById('myChart').getContext('2d');
            var chart = new Chart(ctx, {
                // The type of chart we want to create
                type: 'bar',
                // The data for our dataset
                data: {
                    labels: ['0', '20', '40', '60', '80', '100' ],
                    datasets: [{
                        label: 'Histogram',
                        barPercentage: 1,
                        categoryPercentage: 0.8,
                        data: data,
                        backgroundColor: bgroundColour,
                        borderColor: bgroundColour,

                    }]
                },

                // Configuration options go here
                options: {
                    scales: {
                        x: {
                            type: 'linear',
                            offset: false,
                            grid: {
                                offset: false
                            },
                            ticks: {
                                stepSize: 1
                            },
                            title: {
                                display: true,
                                text: 'RdSAP value'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: '#'
                            }
                        }
                    }
                }
            });
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

            $("#control-panel div span[id*=eff]").on('DOMSubtreeModified', function () {
                th = $(this);

                dc = parseInt($(this).attr('data-color'),10);

                $.each(mc, function(name, value){

                    first = parseInt(name.split('-')[0],10);
                    second = parseInt(name.split('-')[1],10);

                    //console.log(between(dc, first, second));

                    if( between(dc, first, second) ){
                        th.attr('class', '');
                        th.addClass(value);
                    }

                });
            });
        });
