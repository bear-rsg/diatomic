
    const {MapboxOverlay} = deck;

    // CHANGEME!
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2VyeXNsZXdpcyIsImEiOiJjbHllbHc0c24wM2V4MnJzYjd6d3NhcDQ5In0.NqG44ctju4Fm25dTP8GqZQ';
    
    var map = new mapboxgl.Map({
        style: 'mapbox://styles/mapbox/standard',
        center: [-1.9003634597200305, 52.475594328826155],
        zoom: 16,
        pitch: 75,
        bearing: -17.6,
        container: 'map',
        antialias: true

    });

    const loadExtras = true;
    
    const lightPresets = {
        sunrise: {
            "id": "sunrise_light",
            "type": "directional",
            "properties": {
                "color": "hsl(41, 100%, 80%)",
                "intensity": 0.5,
                "direction": [15.0, 40.0],
                "cast-shadows": true,
                "shadow-intensity": 0.8
            }
        },
        noon: {
            "id": "noon_light",
            "type": "directional",
            "properties": {
                "color": "hsl(56, 100%, 94%)",
                "intensity": 0.4,
                "direction": [80.0, 40.0],
                "cast-shadows": true,
                "shadow-intensity": 0.1
            }
        },
        sunset: {
            "id": "sunset_light",
            "type": "directional",
            "properties": {
                "color": "hsl(35, 90%, 80%)",
                "intensity": 0.4,
                "direction": [190.0, 40.0],
                "cast-shadows": true,
                "shadow-intensity": 0.8
            }
        },
        night: {
            "id": "night_light",
            "type": "directional",
            "properties": {
                "color": "hsl(200, 50%, 50%)",
                "intensity": 1.0,
                "direction": [270, 40.0],
                "cast-shadows": true,
                "shadow-intensity": 0.2
            }
        },
        cancel: {
            "id": "cancel_light",
            "type": "directional",
            "properties": {
                "color": "hsl(20, 80%, 60%)",
                "intensity": 0.0,
                "direction": [0, 0],
                "cast-shadows": false,
                "shadow-intensity": 0.
            }
        },
    };

    map.on('load', () => {
       buildFilter([ "epcTypeA", "epcTypeB", "epcTypeC", "epcTypeD", "epcTypeE", "epcTypeF", "epcTypeG" ], 'current-energy-efficiency');
    });

    function changeLightPreset(preset) {
        var lightSettings = lightPresets[preset];
        map.setLights([lightSettings]);
    }

    map.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,            
            countries: 'gb',
            bbox: [-1.9285,52.4604,-1.8557,52.4952],
            mapboxgl: mapboxgl
        }), 'top-left'
    );


    var changed_vals = true;

    function flatView() {        
        map.jumpTo({
            pitch: 0,
            bearing: 0
        });
        return;
    }

    function setChanged(opt){
        if(opt==1){
            changed_vals = true;
        }else{
            changed_vals = false;
        }
    }

    function getChanged(){
       return changed_vals;
    }

    const draw = new MapboxDraw({
        displayControlsDefault: false,        
        controls: {
            polygon: true,
            trash: true
        }
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
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-left'
    );

    function clearFoundFeatures() {
        if(map.getLayer('found-layer')){
            map.removeLayer('found-layer');
            map.removeSource('found');
        }
        $('#collapse2').collapse('hide');
        $('#collapse3').collapse('hide');
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

        var foundSrcFeat = removeDuplicates(foundSrcFeat, "UPRN");
        var count = foundSrcFeat.length;
        var eff_count = 0;

        if(count > 0){
            for(var i=0;i<count;i++){
                var histObj = foundSrcFeat[i]; 
                var histVal = '-1';
                if(histType == 'current-energy-efficiency'){
                    histVal = histObj['properties']['current-energy-efficiency'];
                    eff_count++;
                }
                if(histType == 'potential-energy-efficiency'){
                    histVal = histObj['properties']['potential-energy-efficiency'];
                    eff_count++;
                }

                if(histVal >=0 && histVal <= 20) { sum_efficiency_g++; }
                if(histVal >=21 && histVal <= 38) { sum_efficiency_f++; }
                if(histVal >=39 && histVal <= 54) { sum_efficiency_e++; }
                if(histVal >=55 && histVal <= 68) { sum_efficiency_d++; }
                if(histVal >=69 && histVal <= 80) { sum_efficiency_c++; }
                if(histVal >=81 && histVal <= 90) { sum_efficiency_b++; }
                if(histVal >=91 ) { sum_efficiency_a++; }
            }

            var perc_eff_a = (sum_efficiency_a/eff_count)*100;
            var perc_eff_b = (sum_efficiency_b/eff_count)*100;
            var perc_eff_c = (sum_efficiency_c/eff_count)*100;
            var perc_eff_d = (sum_efficiency_d/eff_count)*100;
            var perc_eff_e = (sum_efficiency_e/eff_count)*100;
            var perc_eff_f = (sum_efficiency_f/eff_count)*100;
            var perc_eff_g = (sum_efficiency_g/eff_count)*100;

            return [
                {x: 0, y: perc_eff_g },
                {x: 21, y: perc_eff_f },
                {x: 39, y: perc_eff_e },
                {x: 55, y: perc_eff_d },
                {x: 69, y: perc_eff_c },
                {x: 81, y: perc_eff_b },
                {x: 91, y: perc_eff_a }
            ];
        }
    }

        function buildFilter(arr, ftype) {
        var filter_type = ftype;
        var epcToggleArray = arr;
        
        if(map.getLayer('epc-layer')){

            const epcA_range = [92, 93, 94, 95, 96, 97, 98, 99, 100];
            const epcB_range = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91];
            const epcC_range = [69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80];
            const epcD_range = [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68];
            const epcE_range = [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54];
            const epcF_range = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];
            const epcG_range = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
            var epcFilter = [];
            var epcFilterAll = [];
            epcFilterAll = epcFilterAll.concat(epcA_range).concat(epcB_range).concat(epcC_range).concat(epcD_range).concat(epcE_range).concat(epcF_range).concat(epcG_range);

            var epcShowNone = false;
            if(epcToggleArray.includes('epcTypeNone')){
                epcShowNone = true;
            }
            var toggleCnt = epcToggleArray.length;
            var noneOnly = false;
            if((toggleCnt == 1) && (epcShowNone == true)){
                noneOnly = true;
            }
            var noToggleSet = false;
            if(toggleCnt == 0){
                noToggleSet = true;
            }
            var epcFilterSet = false;

            if((noneOnly == false) && (noToggleSet == false)){
                epcFilterSet = true;
                if(epcToggleArray.includes('epcTypeA')){
                    epcFilter = epcFilter.concat(epcA_range);
                }
                if(epcToggleArray.includes('epcTypeB')){
                    epcFilter = epcFilter.concat(epcB_range);
                }
                if(epcToggleArray.includes('epcTypeC')){
                    epcFilter = epcFilter.concat(epcC_range);
                }
                if(epcToggleArray.includes('epcTypeD')){
                    epcFilter = epcFilter.concat(epcD_range);
                }
                if(epcToggleArray.includes('epcTypeE')){
                    epcFilter = epcFilter.concat(epcE_range);
                }
                if(epcToggleArray.includes('epcTypeF')){
                    epcFilter = epcFilter.concat(epcF_range);
                }
                if(epcToggleArray.includes('epcTypeB')){
                    epcFilter = epcFilter.concat(epcG_range);
                }                
            }

            var selFilter = [];
            var selFilter2 = [];
            var multipleFilters = false;
            if(noneOnly == true){                
                selFilter = ['!', ['in', ['get', filter_type], ['literal', epcFilterAll]]];
            }else{
                if((epcFilterSet == true) && (epcShowNone == true)){
                    multipleFilters = true;
                    selFilter = ['in', ['get', filter_type], ['literal', epcFilter]];
                    selFilter2 = ['!has', ['get', filter_type]]; // show non-epc rated buildings

                }else if(epcFilterSet == true){                    
                    selFilter = ['in', ['get', filter_type], ['literal', epcFilter]];
                }
            }
            if(selFilter.length > 0){
                if(multipleFilters){
                    map.setFilter('epc-layer', ['any',
                         ['in', ['get', filter_type], ['literal', epcFilter]],
                         ['!', ['in', ['get', filter_type], ['literal', epcFilterAll]]]
                    ]);
                }else{
                    map.setFilter('epc-layer', selFilter);
                }
            }else{
                map.setFilter('epc-layer', ['>', ['get', filter_type], 100]);
            }
        }

    }

    function foundLassoFeatures(fpolygonsArr){
        var foundArr = fpolygonsArr;        
        var fc = turf.featureCollection(foundArr);
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
        
        map.addLayer({
            'id': 'found-layer',
            'type': 'fill-extrusion',
            'source': 'found', 
            'paint': {
                'fill-extrusion-color': '#053ef7',
                'fill-extrusion-height': 20,
                'fill-extrusion-opacity': 0.8,
            }
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

    function removeDuplicates(features, comparatorProperty) {
        const uniqueIds = new Set();
        const uniqueFeatures = [];
        for (const feature of features) {
            const id = feature.properties[comparatorProperty];
            if (!uniqueIds.has(id)) {
                uniqueIds.add(id);
                uniqueFeatures.push(feature);
            }
        }
        return uniqueFeatures;
    }

    function updateArea(e) {
        var foundFeaturePolygons = [];

        const data = draw.getAll();
        const polygonData = data.features[0].geometry.coordinates[0];        

        const searchWithin = turf.polygon([polygonData]);
        const answer = document.getElementById('calculated-area');

        const epcRenderedFeatures = map.queryRenderedFeatures({
            layers: ['epc-layer']
        });        

        const epcSourceFeatures = map.querySourceFeatures('epc', {
             'sourceLayer': 'epc-layer'
        });
        
        var featureSet = removeDuplicates(epcRenderedFeatures, "UPRN");

        if (!featureSet.length) {             
            return;
        }

        var foundFeatures = 0;
        var foundFeatureUprns = "";
        var totalEPC = 0;
        var totalPotentialEPC = 0;

        for(var i=0;i<featureSet.length;i++){

            var epcObj = featureSet[i];

            if( epcObj['properties']['current-energy-efficiency'] != null ){                
                if(epcObj['geometry']['type']=='MultiPolygon'){
                    var point_data = epcObj['geometry']['coordinates'][0][0][0];
                }else{
                    var point_data = epcObj['geometry']['coordinates'][0][0];
                }                

                var pntInPolygon = isPointInPolygon(point_data, polygonData);                

                var featureType = epcObj['geometry']['type'];
                var featObj = epcObj;
                
                if(pntInPolygon) {
                    var currUprn = featObj['properties'].UPRN;
                    foundFeatures++;
                    foundFeaturePolygons.push(featObj);
                    foundFeatureUprns += currUprn + "\n";
                    totalEPC += parseInt(featObj['properties']['current-energy-efficiency']);
                    totalPotentialEPC += parseInt(featObj['properties']['potential-energy-efficiency']);                    
                }                

            }

        }
        alert("found " + foundFeatures + " features inside boundary");
        var round = Math.round;
        var averageEfficiency = round(totalEPC / foundFeatures);
        var potentialEfficiency = round(totalPotentialEPC / foundFeatures);
        var fpolygonsArr = JSON.stringify(foundFeaturePolygons);
                
        if(foundFeatures > 0){
            document.getElementById('avg-eff').innerHTML = averageEfficiency;
            document.getElementById('avg-eff').setAttribute('data-color', averageEfficiency);
            document.getElementById('avg-pot-eff').innerHTML = potentialEfficiency;
            document.getElementById('avg-pot-eff').setAttribute('data-color', potentialEfficiency);

        }

        foundLassoFeatures(foundFeaturePolygons);
        setChanged(1);

    }

    const mapDiv = document.getElementById('map');
    //const menuDiv = document.getElementById('menu');
    const lightLevelDiv = document.getElementById('lightlevel');
    const epcRatingOptionsNav = document.getElementById('epc_rating_options');

    mapDiv.appendChild(document.getElementById('control-panel'));
    //if(menuDiv != null){
    //    mapDiv.appendChild(menuDiv);
    //}
    if(document.getElementById('loader') != null){
        mapDiv.appendChild(document.getElementById('loader'));
    }
    if(document.getElementById('side-panel-btn') != null){
        mapDiv.appendChild(document.getElementById('side-panel-btn'));
    }
    if(document.getElementById('info-pane') != null){
        mapDiv.appendChild(document.getElementById('info-pane'));
    }
    if(document.getElementById('info-pane-btn') != null){
        mapDiv.appendChild(document.getElementById('info-pane-btn'));
    }
    if(document.getElementById('diatomicModal') != null){
        mapDiv.appendChild(document.getElementById('diatomicModal'));
    }
    if(document.getElementById('lightLevelDiv') != null){
        mapDiv.appendChild(document.getElementById('lightLevelDiv'));
    }

    //const inputs = menuDiv.getElementsByTagName('input');

    /*for (const input of inputs) {
        input.onclick = (layer) => {
            const layerId = layer.target.id;
            map.setStyle('mapbox://styles/mapbox/' + layerId);
        };
    }*/

    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-left');

    map.on('mouseenter', 'epc-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'epc-layer', () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('click', 'epc-layer', (e) => {

        $('#control-panel').show();
        $('#collapse1').collapse('show');

        const features = e.features[0];        

        const coordinates = features.geometry.coordinates;
        if(features['properties']['current-energy-efficiency']) {
            msg = '' + features['properties']['current-energy-efficiency'];
        }else{
            msg = '-';
        }
        if(features['properties']['potential-energy-efficiency']) {
            msg2 = '' + features['properties']['potential-energy-efficiency'];
        }else{
            msg2 = '-';
        }
        if(features['properties']['UPRN']) {
            msg3 = '' + features['properties']['UPRN'];
        }else{
            msg3 = '-';
        }


        if(coordinates != null){
            var coord_feature = coordinates;
            msg4_all = '' + coord_feature;
            msg4_arr = msg4_all.split(',');
               msg4 = "\n";
               msg4 += msg4_arr[0]+"\n";
               msg4 += msg4_arr[1]+"\n";
        }else{
            msg4 = '-';

        }
        
        const currentEfficiency = features['properties']['current-energy-efficiency'];
        const potentialEfficiency = features['properties']['potential-energy-efficiency'];

        document.getElementById('cur-eff').innerHTML = msg;
        document.getElementById('cur-eff').setAttribute('data-color', msg);
        document.getElementById('pot-eff').innerHTML = msg2;
        document.getElementById('pot-eff').setAttribute('data-color', msg2);
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

    stopSpinner = (e) => {        
        document.getElementById("loader").style.visibility = "hidden";
        map.off('idle', stopSpinner);       
        setChanged(1);
    }

    map.on('styledata', () => {
        document.getElementById("loader").style.visibility = "visible";
        if(!map.getSource('epc')){
            map.addSource('epc', {
                type: 'geojson',                
                data: 'https://bear-rsg.github.io/diatomic/js/data/wmca_epc_data.geojson'
            });

            map.addLayer({
                'id': 'epc-layer',
                'source': 'epc',
                'type': 'fill-extrusion',
                'paint': {                    
                    'fill-extrusion-color': {
                        property: 'current-energy-efficiency',
                        stops: [[0, '#d4340d'], [21, '#f06e2d'], [39, '#f8b368'], [55, '#f0c713'], [69, '#8cc637'], [81, '#1bb359'], [92, '#02895d']]
                    },
                    'fill-extrusion-height': 15,
                    'fill-extrusion-opacity': 0.8,
                }
            });
        }

        if(loadExtras){
            if(!map.getSource('wards')){
                map.addSource('wards', {
                    type: 'geojson',
                    data: 'https://bear-rsg.github.io/diatomic/js/data/CLP-wards_4326.geojson'
                });
                map.addLayer({
                    'id': 'wardBoundaries',
                    'type': 'line',
                    'source': 'wards', 
                    'layout': {
                        'visibility': 'none',
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'minzoom': 10,
                    'maxzoom': 15,
                    'paint': {
                        'line-color': '#385dce',                         
                        'line-width': {
                            'type': 'exponential',
                            'stops': [
                                [11, 2],
                                [15, 3],
                            ]
                        },
                    }
                });
            }
            if(!map.getSource('lsoas')){
                map.addSource('lsoas', {
                    type: 'geojson',
                    data: 'https://bear-rsg.github.io/diatomic/js/data/EBNS_LSOA_epc_4326.geojson'
                });
                map.addLayer({
                    "id": "lsoaChoropleth",
                    "type": "fill",
                    "source": "lsoas",
                    'layout': {                        
                        'visibility': 'none'
                    },
                    "paint": {
                        'fill-color': [
                            'step',
                            ['get', '1A_1B_1C_1D'],
                            '#660000', 1,
                            '#cc0000', 2,
                            '#f44336', 3,
                            '#e06666', 4,
                            '#f4cccc', 5,
                            '#d0e0e3', 6,
                            '#9fc5e8', 7,
                            '#2986cc', 8,
                            '#0b5394', 9,
                            '#073763'
                        ],
                        'fill-outline-color': 'rgba(0, 0, 0, 0.2)',
                        'fill-opacity': 0.5
                    },
                });
            }
            
            if(!map.getSource('chargepoints')){
                map.addSource('chargepoints', {
                    type: 'geojson',
                    'data': 'https://bear-rsg.github.io/diatomic/js/data/NCR_Bham_Cov_4326.geojson'
                });
                map.addLayer({
                    'id': 'chPoints',
                    'type': 'circle',
                    'source': 'chargepoints',
                    'minzoom': 10,
                    'layout': {
                        // Make the layer non-visible by default.
                        'visibility': 'none'
                    },
                    'paint': {                        
                        'circle-radius': {
                            'type': 'exponential',
                            'stops': [
                                [10, 3],
                                [16, 8],
                                [22, 15],
                            ]
                        },
                        "circle-color": "#913bfb",
                        'circle-stroke-color': '#ffffff', 
                        'circle-stroke-width': {
                            'type': 'exponential',
                            'stops': [
                                [11, 2],
                                [18, 6],
                            ]
                        },
                        'circle-opacity': 0.8,
                    }
                });
            }
        }

        map.on('idle', stopSpinner);
    });

    map.on('style.load', () => {        
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
        ).id;

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

    window.onload = function() {
        startSpinner();
    };

    function resetCanvas(canvasId){
        var removeID = "#"+canvasId;
        $(removeID).remove();
        $("<canvas id='" + canvasId + "'><canvas>").insertAfter( "#hist_options" );
        selected_value = $("input[name='chart_type']:checked").val();
        if(selected_value == 'eff'){
            $('#effChart').removeClass('hidden');
            $('#potChart').addClass('hidden');
        }else{
            $('#potChart').removeClass('hidden');
            $('#effChart').addClass('hidden');
        }
    };

    map.on('idle', (e) => {

        if(getChanged()){

            var foundSourceFeatures = [];
            if(map.getLayer('found-layer')){
                $('#collapse2').collapse('show');
                $('#collapse3').collapse('show');
                $('h4.panel-title > a[href="#collapse3"]').text("Lasso values");
                foundSourceFeatures = removeDuplicates(map.queryRenderedFeatures({layers: ['found-layer']}), "UPRN");
            }else{
                $('h4.panel-title > a[href="#collapse3"]').text("Overview");
                foundSourceFeatures = removeDuplicates(map.queryRenderedFeatures({layers: ['epc-layer']}), "UPRN");
            }

            foundSourceFeaturesCnt = foundSourceFeatures.length;
            var hist_eff_data = [];
            var hist_pot_data = [];
            if (foundSourceFeaturesCnt > 0){
                hist_eff_data = buildHistogramData(foundSourceFeatures, 'current-energy-efficiency');
                hist_pot_data = buildHistogramData(foundSourceFeatures, 'potential-energy-efficiency');
            }

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
                currLabelValues.push(hist_eff_data[i].x);
            }

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
                potLabelValues.push(hist_pot_data[i].x);
            }

            resetCanvas('effChart');
            var eff_ctx = document.getElementById('effChart').getContext('2d');
            var chart1 = new Chart(eff_ctx, {                
                type: 'bar',                
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
                
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            bottom: 30
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'percentage'
                            }
                        }
                    }
                }
            });

            resetCanvas('potChart');
            var pot_ctx = document.getElementById('potChart').getContext('2d');
            var chart2 = new Chart(pot_ctx, {
                type: 'bar',
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
                
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            bottom: 16
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            type: 'linear',
                            title: {
                                display: true,
                                text: '%'
                            }
                        }
                    }
                }
            });

            setChanged(0);
        }

        /* switchlayer = function (lname) {
            if (document.getElementById(lname + "_toggle").parent().attr('aria-checked')) {
                map.setLayoutProperty(lname, 'visibility', 'visible');
            } else {
                map.setLayoutProperty(lname, 'visibility', 'none');
            }
        } */
    });

    $(document).ready(function(){

        $('.mapbox-gl-draw_ctrl-draw-btn').on("mousedown", function() {
            draw.deleteAll();
            $('#avg-eff').text('-');
            $('#avg-eff').attr('data-color','');
            $('#avg-pot-eff').text('-');
            $('#avg-pot-eff').attr('data-color','');
            flatView();
            $('#control-panel').show();
            $('#collapse2').collapse('show');

        });

        $('.mapbox-gl-draw_trash').on("mousedown", function() {
            clearFoundFeatures();
        });

        //$('#basemap_div').insertAfter($(".mapboxgl-ctrl-top-left div:last"));

        //$( "#menu" ).hide();
        $('#control-panel').hide();

        //$('#basemap_div').click(function(){
        //    $('#menu').toggle('slow');
        //});

        $('.open_panel').click(function(){
            $('#control-panel').toggle();
            $('#potChart').addClass('hidden');
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

        $('#hist_options').change(function(){
            selected_value = $("input[name='chart_type']:checked").val();
            if(selected_value == 'eff'){
                $('#effChart').removeClass('hidden');
                $('#potChart').addClass('hidden');
            }else{
                $('#potChart').removeClass('hidden');
                $('#effChart').addClass('hidden');
            }
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

                if(between(dc, first, second) ){
                    th.attr('class', value);
                }

            });
        });

        $('#diatomicModal').on('shown.bs.modal', function (e) {

            var button = $(e.relatedTarget);
            var type = button.attr('data-type');

            var myModal = $(this);

            var hist_content = '';
            var hist_title = '';
            var hist_opt = document.querySelector('input[name="chart_type"]:checked').value;

            if(hist_opt == 'eff'){
                hist_title = 'Current Efficiency Histogram';
                hist_content = document.getElementById('effChart');
            }

            if(hist_opt == 'pot'){
                hist_title = 'Potential Efficiency Histogram';
                hist_content = document.getElementById('potChart');
            }

            var std_content = "My test content";

            if(type == 'histogram'){
                $('.modal-title').text(hist_title);
                $('.modal-body').html(hist_content);

            }else{
                $('.modal-title').text("My Test Modal");
                $('.modal-body').text(std_content);
           }

            $('#modal-title').trigger('focus');
        });

        $('#modal-close').on('click', function (e) {
            var hist_content = '';
            if($('#diatomicModalBody > #effChart').length != 0){
                hist_content = document.getElementById('effChart');
            }
            if($('#diatomicModalBody > #potChart').length != 0){
                hist_content = document.getElementById('potChart');
            }
            $(hist_content).insertAfter("#hist_options");
        });

        var checkbox_link = document.querySelector('#lsoaListtogglediv');
        var checkbox_link2 = document.querySelector('#wardBoundariestogglediv');
        var checkbox_link3 = document.querySelector('#chPointstogglediv');

        var checkbox_layer = '';

        checkbox_link.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();

            if($(this).attr('id') == 'lsoaListtogglediv'){
                checkbox_layer = 'lsoaChoropleth';
            }
            var clickedLayer = checkbox_layer;

            var is_active = $(this).find('.ui-switcher').attr('aria-checked');
            var toggle_on = false;
            if(is_active == 'true'){
                toggle_on = true;
            }

            const visibility = map.getLayoutProperty(
                                clickedLayer,
                                'visibility'
                            );

            if(toggle_on) {
                map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
            } else {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            }
        };

        checkbox_link2.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();

            if($(this).attr('id') == 'wardBoundariestogglediv'){
                checkbox_layer = 'wardBoundaries';
            }

            var clickedLayer = checkbox_layer;

            var is_active = $(this).find('.ui-switcher').attr('aria-checked');
            var toggle_on = false;
            if(is_active == 'true'){
                toggle_on = true;
            }

            if(toggle_on) {
                map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
            } else {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            }
        };

        checkbox_link3.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();

            if($(this).attr('id') == 'chPointstogglediv'){
                checkbox_layer = 'chPoints';
            }

            var clickedLayer = checkbox_layer;

            var is_active = $(this).find('.ui-switcher').attr('aria-checked');
            var toggle_on = false;
            if(is_active == 'true'){
                toggle_on = true;
            }
            
            if(toggle_on) {
                map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
            } else {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            }
        };

        var activeEpcFilters = [];

        const filterNav = document.getElementById('filter-group-epc-type');
        const epcToggleOpts = filterNav.getElementsByClassName('toggletrigger');
        const epcRadioOpts = document.getElementsByName('rating_type');

        Array.prototype.forEach.call(epcRadioOpts, function(epcRadioOpt) {
            epcRadioOpt.addEventListener('change', updateActiveEpcFilters);
        });

        function updateActiveEpcFilters(){
            activeEpcFilters = [];
            const filtNav = document.getElementById('filter-group-epc-type');
            const epcTglOpts = filtNav.getElementsByClassName('toggletrigger');
            for (const epcToggleOpt of epcTglOpts) {
                var is_active = false;
                var aria = epcToggleOpt.querySelector('.ui-switcher').getAttribute('aria-checked');
                if(aria == 'true'){
                    is_active = true;
                }

                if(is_active) {
                    var active_val = epcToggleOpt.querySelector('.epc-check-input').getAttribute('value');
                    activeEpcFilters.push(active_val);
                }

            }
            
            var epcType = 'current-energy-efficiency';
            if (epcRatingOptionsNav.querySelector('#pot_epc').checked) {
              epcType = 'potential-energy-efficiency';
            }
            
            buildFilter(activeEpcFilters, epcType);
        }

        Array.prototype.forEach.call(epcToggleOpts, function(epcToggleOpt) {
            epcToggleOpt.addEventListener('change', updateActiveEpcFilters);
        });

        const lightOpts = lightLevelDiv.getElementsByTagName('img');
        for (const opt of lightOpts) {
            opt.onclick = (lightObj) => {
                const lightName =  lightObj.target.name;
                changeLightPreset(lightName);
            };
        }

    });
