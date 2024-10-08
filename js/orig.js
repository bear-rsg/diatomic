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
        pitch: 75,
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
        }), 'top-left'
    );


    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    function filterBy(month) {
        const filters = ['==', 'month', month];
        //map.setFilter('epc-circles', filters);
        //map.setFilter('epc-labels', filters);

        // Set the label to the month
        document.getElementById('month').textContent = months[month];
    }

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

    map.addControl(draw, 'top-left');

    map.on('draw.create', updateArea);
    map.on('draw.delete', clearFoundFeatures);
    map.on('draw.update', updateArea);

    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            // When active the map will receive updates to the device's location as it changes.
            trackUserLocation: true,
            // Draw an arrow next to the location dot to indicate which direction the device is heading.
            showUserHeading: true
        }), 'top-left'
    );

    function clearFoundFeatures() {
        if(map.getLayer('found-layer')){
            map.removeLayer('found-layer');
            console.log('found-layer has been removed');
            map.removeSource('found');
            console.log('found source has been removed');
        }
    }

    function buildHistogramData(foundSrcFeat, histType){

        var sum_efficiency_a = 0;
        var sum_efficiency_b = 0;
        var sum_efficiency_c = 0;
        var sum_efficiency_d = 0;
        var sum_efficiency_e = 0;
        var sum_efficiency_f = 0;
        var sum_efficiency_g = 0;

        var perc_efficiency_a = 0;
        var perc_efficiency_b = 0;
        var perc_efficiency_c = 0;
        var perc_efficiency_d = 0;
        var perc_efficiency_e = 0;
        var perc_efficiency_g = 0;

        var count = foundSrcFeat.length;
        console.log('foundSrcFeat:' + JSON.stringify(foundSrcFeat));
        if(count > 0){
            console.log(count);
            for(var i=0;i<count;i++){
                var histObj = foundSrcFeat[i]; // features
                console.log('histObj:' + JSON.stringify(histObj));
                console.log('histType: '+ histType);
                var histVal = '-1';
                if(histType == 'current-energy-efficiency'){
                    histVal = histObj['properties']['current-energy-efficiency'];
                }
                if(histType == 'potential-energy-efficiency'){
                    histVal = histObj['properties']['potential-energy-efficiency'];
                }
                console.log('histVal: ' + histVal);

                if(histVal >=0 && histVal <= 20) { sum_efficiency_g++; }
                if(histVal >=21 && histVal <= 38) { sum_efficiency_f++; }
                if(histVal >=39 && histVal <= 54) { sum_efficiency_e++; }
                if(histVal >=55 && histVal <= 68) { sum_efficiency_d++; }
                if(histVal >=69 && histVal <= 80) { sum_efficiency_c++; }
                if(histVal >=81 && histVal <= 90) { sum_efficiency_b++; }
                if(histVal >=91 ) { sum_efficiency_a++; }

                console.log('sum_efficiency_a: ' + sum_efficiency_a);
                console.log('sum_efficiency_b: ' + sum_efficiency_b);
                console.log('sum_efficiency_c: ' + sum_efficiency_c);
                console.log('sum_efficiency_d: ' + sum_efficiency_d);
                console.log('sum_efficiency_e: ' + sum_efficiency_e);
                console.log('sum_efficiency_f: ' + sum_efficiency_f);
                console.log('sum_efficiency_g: ' + sum_efficiency_g);
            }

            var perc_eff_a = sum_efficiency_a/count;
            var perc_eff_b = sum_efficiency_b/count;
            var perc_eff_c = sum_efficiency_c/count;
            var perc_eff_d = sum_efficiency_d/count;
            var perc_eff_e = sum_efficiency_e/count;
            var perc_eff_f = sum_efficiency_f/count;
            var perc_eff_g = sum_efficiency_g/count;

            return [
                {x: 0, y: perc_eff_g },
                {x: 21, y: perc_eff_f },
                {x: 39, y: perc_eff_e },
                {x: 55, y: perc_eff_d },
                {x: 69, y: perc_eff_c },
                {x: 81, y: perc_eff_b },
                {x: 91, y: perc_eff_a }
            ];
        } else {
                return [
                    {x: 0, y: 0 },
                    {x: 21, y: 0 },
                    {x: 39, y: 0 },
                    {x: 55, y: 0 },
                    {x: 69, y: 0 },
                    {x: 81, y: 0 },
                    {x: 91, y: 0 }
                ];
        }
    }

    function foundLassoFeatures(fpolygonsArr){
        var foundArr = fpolygonsArr;
        console.log('fpolygonsArr passed to foundLassoFeatures: '+ foundArr);
        var fc = turf.featureCollection(foundArr);
        console.log('fc: '+ JSON.stringify(fc));
        clearFoundFeatures();

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

        var histogram_current_data_a = [];
        var histogram_potential_data = [];

        //alert("added found features layer");
    }

    function flatView() {
        console.log("going to flat view");
        map.jumpTo({
            //zoom: 16,
            pitch: 0,
            bearing: 0
        });
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
        // alert("updating info for lasso");
        var foundFeaturePolygons = [];

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
        var totalEPC = 0;
        var totalPotentialEPC = 0;

        for(var i=0;i<featureSet.length;i++){

            var epcObj = featureSet[i];

            if( epcObj['properties']['current-energy-efficiency'] != null ){
                //var lasso_polygon = searchWithin;
                if(epcObj['geometry']['type']=='MultiPolygon'){
                    var point_data = epcObj['geometry']['coordinates'][0][0][0];
                }else{
                    var point_data = epcObj['geometry']['coordinates'][0][0];
                }
                console.log("point_data:" + point_data);

                var pntInPolygon = isPointInPolygon(point_data, polygonData);
                console.log("pntInPolygon (" + point_data + "): "+ pntInPolygon);
                console.log("epcObj['geometry']['coordinates'][0]:" + epcObj['geometry']['coordinates'][0]);

                var featureType = epcObj['geometry']['type'];
                var featObj = epcObj;
                if(pntInPolygon) {
                    var splitFoundUprns = foundFeatureUprns.split('\n');
                    console.log("Already found: " + JSON.stringify(splitFoundUprns));
                    var currUprn = featObj['properties'].UPRN;
                    console.log("Already found " + currUprn + ": "+ splitFoundUprns.includes(currUprn));
                    if(!splitFoundUprns.includes(currUprn)){
                        foundFeatures++;
                        foundFeaturePolygons.push(featObj);
                        foundFeatureUprns += currUprn + "\n";
                        totalEPC += parseInt(featObj['properties']['current-energy-efficiency']);
                        totalPotentialEPC += parseInt(featObj['properties']['potential-energy-efficiency']);
                        console.log("Feature UPRN: "+ featObj['properties'].UPRN + " ("+featureType+") is inside boundary");
                    }else{
                        console.log(currUprn + " already in found array");
                    }
                }else {
                    console.log("Feature UPRN: "+ featObj['properties'].UPRN + " ("+featureType+") not inside boundary");
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
    mapDiv.appendChild(document.getElementById("side-panel-btn"));
    mapDiv.appendChild(document.getElementById("info-pane"));
    mapDiv.appendChild(document.getElementById("info-pane-btn"));
    const menuDiv = document.getElementById('menu');

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
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    // Add fullscreen option
    map.addControl(new mapboxgl.FullscreenControl(), 'top-left');

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
        $('#control-panel').show();
        $('#collapse1').collapse('show');

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

        function startSpinner() {
            document.getElementById("loader").style.visibility = "visible";
            map.on('idle', stopSpinner);
        }

        window.onload = function() {
            startSpinner();
        };

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

            var foundSourceFeatures = [];
            if(map.getLayer('found-layer')){
                foundSourceFeatures = map.queryRenderedFeatures({layers: ['found-layer']});
                $('#collapse3').collapse('show');
            }else{
                foundSourceFeatures = map.queryRenderedFeatures({layers: ['epc-layer']});
            }

            /*
            const hist_data = [ // display values
                {x: 30, y: 10},
                {x: 50, y: 20},
                {x: 70, y: 70},
                {x: 80, y: 80},
                {x: 90, y: 10}
            ];
            */

            const hist_eff_data = buildHistogramData(foundSourceFeatures, 'current-energy-efficiency');
            const hist_pot_data = buildHistogramData(foundSourceFeatures, 'potential-energy-efficiency');
            
            const currBgroundColour = [];
            const currLabelValues = [];
           
            for(i=0; i < hist_eff_data.length; i++) {
                if(hist_eff_data[i].x >=0 && hist_eff_data[i].x <= 20) { currBgroundColour.push('hsl(357,82%,53%)') }
                if(hist_eff_data[i].x >=21 && hist_eff_data[i].x <= 38) { currBgroundColour.push('hsl(20,87%,56%)') }
                if(hist_eff_data[i].x >=39 && hist_eff_data[i].x <= 54) { currBgroundColour.push('hsl(38,91%,59%)') }
                if(hist_eff_data[i].x >=55 && hist_eff_data[i].x <= 68) { currBgroundColour.push('hsl(58,87%,58%)') }
                if(hist_eff_data[i].x >=69 && hist_eff_data[i].x <= 80) { currBgroundColour.push('hsl(87,53%,56%)') }
                if(hist_eff_data[i].x >=81 && hist_eff_data[i].x <= 91) { currBgroundColour.push('hsl(150,86%,28%)') }
                if(hist_eff_data[i].x >=92 && hist_eff_data[i].x <= 100) { currBgroundColour.push('hsl(214,45%,49%)') }
                currLabelValues.push(hist_eff_data[i].x)
            }
            console.log('currLabelValues: '+currLabelValues);
            
            const potBgroundColour = [];
            const potLabelValues = [];
           
            for(i=0; i < hist_pot_data.length; i++) {
                if(hist_pot_data[i].x >=0 && hist_pot_data[i].x <= 20) { potBgroundColour.push('hsl(357,82%,53%)') }
                if(hist_pot_data[i].x >=21 && hist_pot_data[i].x <= 38) { potBgroundColour.push('hsl(20,87%,56%)') }
                if(hist_pot_data[i].x >=39 && hist_pot_data[i].x <= 54) { potBgroundColour.push('hsl(38,91%,59%)') }
                if(hist_pot_data[i].x >=55 && hist_pot_data[i].x <= 68) { potBgroundColour.push('hsl(58,87%,58%)') }
                if(hist_pot_data[i].x >=69 && hist_pot_data[i].x <= 80) { potBgroundColour.push('hsl(87,53%,56%)') }
                if(hist_pot_data[i].x >=81 && hist_pot_data[i].x <= 91) { potBgroundColour.push('hsl(150,86%,28%)') }
                if(hist_pot_data[i].x >=92 && hist_pot_data[i].x <= 100) { potBgroundColour.push('hsl(214,45%,49%)') }
                potLabelValues.push(hist_pot_data[i].x)
            }
            console.log('potLabelValues: '+potLabelValues);
            
            var eff_ctx = document.getElementById('effChart').getContext('2d');
            var chart1 = new Chart(eff_ctx, {
                // The type of chart we want to create
                type: 'bar',
                // The data for our dataset
                data: {
                    labels: ['G', 'F', 'E', 'D', 'C', 'B', 'A' ],
                    datasets: [{
                        label: 'Current Efficiency',
                        barPercentage: 1,
                        categoryPercentage: 0.8,
                        data: hist_eff_data,
                        backgroundColor: currBgroundColour,
                        borderColor: currBgroundColour,

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
                                text: 'Category'
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

            var pot_ctx = document.getElementById('potChart').getContext('2d');
            var chart2 = new Chart(pot_ctx, {
                // The type of chart we want to create
                type: 'bar',
                // The data for our dataset
                data: {
                    labels: ['G', 'F', 'E', 'D', 'C', 'B', 'A' ],
                    datasets: [{
                        label: 'Potential Efficiency',
                        barPercentage: 1,
                        categoryPercentage: 0.8,
                        data: hist_pot_data,
                        backgroundColor: potBgroundColour,
                        borderColor: potBgroundColour,

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
                                text: 'Category'
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

        $('#basemap_div').insertAfter($(".mapboxgl-ctrl-top-left div:last"));
        $('.mapbox-gl-draw_polygon').click(function(){
            flatView();
            $('#control-panel').show();
            $('#collapse2').collapse('show');
        });
        $( "#menu" ).hide();
        $('#control-panel').hide();

        $('#basemap_div').click(function(){
            $('#menu').toggle('slow');
        });

        $('.open_panel').click(function(){
            $('#control-panel').toggle('slow');
        });

        $('.closebtn').click(function(){
            $('#control-panel').toggle('slow');
        });

        $('.closeinfobtn').click(function(){
            $('#info-pane').toggle('slow');
        });

        $('#info-pane-btn').click(function(){
            $('#info-pane').toggle('slow');
        });



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

        $('#exampleModal').on('shown.bs.modal', function () {
          $('#modal-title').trigger('focus')
        })
    });
