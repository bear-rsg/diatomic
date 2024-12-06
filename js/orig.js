
    const {MapboxOverlay} = deck;

    // CHANGEME!
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2VyeXNsZXdpcyIsImEiOiJjbHllbHc0c24wM2V4MnJzYjd6d3NhcDQ5In0.NqG44ctju4Fm25dTP8GqZQ';

    // Initialize mapbox map
    var map = new mapboxgl.Map({
        style: 'mapbox://styles/mapbox/standard',
        center: [-1.8952129084026341, 52.479069298525694],
        zoom: 16,
        pitch: 75,
        bearing: 17.6,
        container: 'map',
        antialias: true
    });

    const googleTilesLayer = new deck.Tile3DLayer({
        id: 'google-3d-tiles',
        data: 'https://tile.googleapis.com/v1/3dtiles/root.json?key=AIzaSyBiSqMy2mo-_26_9XDoU5VTevOOo_GSCWQ', // CHANGEME!
        loaderOptions: {
            tilesetUrl: 'https://3dtiles.googleapis.com/v1/maps/',
            '3d-tiles': {
                fetchOptions: {
                    mode: 'cors'
                }
            },
            showCreditsOnScreen: true
        },
        pickable: true,
        pointSize: 2,
    });

    const deckOverlay = new MapboxOverlay({
        interleaved: true,
        initialViewState: {
            longitude: -1.8952129084026341,
            latitude: 52.479069298525694,
            zoom: 18.5,
            pitch: 75,
            bearing: 17.6
        },
        layers: [googleTilesLayer],
        beforeId: 'firstSymbolId'
    });


    const loadExtras = true;

    var round = Math.round;

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
    };

    map.on('load', () => {
       map.resize();
       //map.addControl(deckOverlay);
       map.setConfigProperty('basemap', 'lightPreset', 'day');
       buildFilter([ "epcTypeA", "epcTypeB", "epcTypeC", "epcTypeD", "epcTypeE", "epcTypeF", "epcTypeG" ], 'current-energy-efficiency');
       if(map.getLayer('google-3d-tiles')){
           map.setLayoutProperty('google-3d-tiles', 'visibility', 'none');
       }
       startSpinner();
    });

    function makeRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function changeLightPreset(preset) {
        //var lightSettings = lightPresets[preset];
        //map.setLights([lightSettings]);
        map.setConfigProperty('basemap', 'lightPreset', preset);
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

    function jumpToView(center_val, zoom_val, pitch_val, bearing_val) {
        map.jumpTo({
            center: center_val,
            zoom: zoom_val,
            pitch: pitch_val,
            bearing: bearing_val
        });
        return;
    }
    function zoomHigherFlat() {
        map.jumpTo({
            pitch: 0,
            bearing: 0,
            zoom: 12
        });
        return;
    }

    function flatView() {
        console.log("going to flat view");
        map.jumpTo({
            pitch: 0,
            bearing: 0
        });
        return;
    }

    function angleView() {
        console.log("going to angle view");
        map.jumpTo({
            pitch: 75,
            bearing: 17.6
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

    map.on('draw.create', updateLassoArea);
    map.on('draw.delete', clearFoundFeatures);
    map.on('draw.update', updateLassoArea);

    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-left'
    );

    function getRenderedFeatures(layerName){
        const renderedFeatures = map.queryRenderedFeatures({
            layers: [layerName]
        });

        return renderedFeatures
    }

    function getSourceFeatures(srcName, layerName){
        const sourceFeatures = map.querySourceFeatures(srcName, {
             'sourceLayer': layerName
        });
        return sourceFeatures
    }

function getCurrentDisplayInfo(){
        var zoom = map.getZoom();
        const zoom_str = zoom.toString();
        const zoom_trim = zoom_str.slice(0, 4);
        var centre = map.getCenter();
        const lat_str = centre['lat'].toString();
        const lat = lat_str.slice(0, 6);
        const lng_str = centre['lng'].toString();
        const lng = lng_str.slice(0, 7);
        var pitch = map.getPitch();
        const pitch_str = pitch.toString();
        const pitch_trim = pitch_str.slice(0, 4);
        var bearing = map.getBearing();
        const bearing_str = bearing.toString();
        const bearing_trim = bearing_str.slice(0, 5);
        var toggleArr = [];
        let valuesDict = { 'zoom': zoom_trim, 'centre_lat': lat, 'centre_lng': lng, 'pitch': pitch_trim, 'bearing': bearing_trim, 'toggles': toggleArr };
        return valuesDict;
    }

    document.getElementById("map").addEventListener('mousemove', function() {
        let currDisplayInfo = getCurrentDisplayInfo();
        //alert(JSON.stringify(currDisplayInfo));
        let zoom = currDisplayInfo['zoom'];
        let centre_lat = currDisplayInfo['centre_lat'];
        let centre_lng = currDisplayInfo['centre_lng'];
        let pitch = currDisplayInfo['pitch'];
        let bearing = currDisplayInfo['bearing'];
        document.getElementById("zoom-val").innerHTML = zoom;
        document.getElementById("centre-val").innerHTML = centre_lat + ', ' + centre_lng;
        document.getElementById("pitch-val").innerHTML = pitch;
        document.getElementById("bearing-val").innerHTML = bearing;
    });


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
                'fill-extrusion-height': 35,
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

    function dataInDefinedArea(featureDataset, boundaryPoints){

        const areaPolygon = turf.polygon([boundaryPoints]);
        const epcRenderedFeatures = map.queryRenderedFeatures({
            layers: ['epc-layer']
        });

        var featureSet = featureDataset;

        if (!featureSet.length) {
            console.log("no epc data found");
            return;
        }
        var foundFeaturePolygons = [];
        var foundFeatures = 0;
        var foundFeatureUprns = "";
        var totalEPC = 0;
        var totalPotentialEPC = 0;

        var returnData = {};

        for(var i=0;i<featureSet.length;i++){

            var epcObj = featureSet[i];

            if( epcObj['properties']['current-energy-efficiency'] != null ){
                if(epcObj['geometry']['type']=='MultiPolygon'){
                    var point_data = epcObj['geometry']['coordinates'][0][0][0];
                }else{
                    var point_data = epcObj['geometry']['coordinates'][0][0];
                }
                console.log("point_data:" + point_data);

                var pntInPolygon = isPointInPolygon(point_data, boundaryPoints);
                console.log("pntInPolygon (" + point_data + "): "+ pntInPolygon);
                console.log("epcObj['geometry']['coordinates'][0]:" + epcObj['geometry']['coordinates'][0]);

                var featureType = epcObj['geometry']['type'];
                var featObj = epcObj;
                if(pntInPolygon) {
                    var currUprn = featObj['properties'].UPRN;
                    foundFeatures++;
                    foundFeaturePolygons.push(featObj);
                    foundFeatureUprns += currUprn + "\n";
                    totalEPC += parseInt(featObj['properties']['current-energy-efficiency']);
                    totalPotentialEPC += parseInt(featObj['properties']['potential-energy-efficiency']);
                    console.log("Feature UPRN: "+ featObj['properties'].UPRN + " ("+featureType+") is inside boundary");
                }else {
                    console.log("Feature UPRN: "+ featObj['properties'].UPRN + " ("+featureType+") not inside boundary");
                }

            }

        }

        returnData["foundFeaturePolygons"] = foundFeaturePolygons;
        returnData["foundFeatures"] = foundFeatures;
        returnData["totalEPC"] = totalEPC;
        returnData["totalPotentialEPC"] = totalPotentialEPC;
        returnData["foundFeatureUprns"] = foundFeatureUprns;

        return returnData

    }

    function updateLassoArea(e) {
        // alert("updating info for lasso");

        const data = draw.getAll();
        const polygonData = data.features[0].geometry.coordinates[0];
        //console.log("Boundary polygon points:" + JSON.stringify(polygonData));

        const epcRenderedFeatures = getRenderedFeatures('epc-layer');
        console.log("epc rendered data found*: " + JSON.stringify(epcRenderedFeatures));

        const epcSourceFeatures = getSourceFeatures('epc', 'epc-layer');
        console.log("epc source data found*: " + JSON.stringify(epcSourceFeatures));

        var featureSet = removeDuplicates(epcRenderedFeatures, "UPRN");

        var foundFeatures = 0;
        var foundFeatureUprns = "";
        var totalEPC = 0;
        var totalPotentialEPC = 0;

        if (!featureSet.length) {
            console.log("no epc data found");
            return;
        }
        else{
            console.log("epcRenderedFeatures length: "+featureSet.length);
            console.log("epc data found: " + JSON.stringify(featureSet[0]['geometry']['coordinates']));
        }

        const areaData = dataInDefinedArea(featureSet, polygonData);

        var foundFeaturePolygons = areaData.foundFeaturePolygons;
        var foundFeatures = areaData.foundFeatures;
        var totalEPC = areaData.totalEPC;
        var totalPotentialEPC = areaData.totalPotentialEPC;
        var foundFeatureUprns = areaData.foundFeatureUprns;

alert("found " + foundFeatures + " features inside boundary");

        var averageEfficiency = '';
        if(round(totalEPC / foundFeatures) > 0){
            averageEfficiency = round(totalEPC / foundFeatures);
        }
        var averagePotentialEfficiency = '';
        if(round(totalPotentialEPC / foundFeatures) > 0){
            averagePotentialEfficiency = round(totalPotentialEPC / foundFeatures);
        }
        var fpolygonsArr = JSON.stringify(foundFeaturePolygons);

        if(foundFeatures > 0){
            document.getElementById('avg-eff').innerHTML = averageEfficiency;
            document.getElementById('avg-eff').setAttribute('data-color', averageEfficiency);
            document.getElementById('avg-pot-eff').innerHTML = averagePotentialEfficiency;
            document.getElementById('avg-pot-eff').setAttribute('data-color', averagePotentialEfficiency);

        }

        foundLassoFeatures(foundFeaturePolygons);
        //alert("polygonData: "+polygonData+"\n\nfoundFeatureUprns: \n\n" + foundFeatureUprns + "");
        console.log("Found Feature Uprns: \n\n" + foundFeatureUprns + "");
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
    if(lightLevelDiv != null){
        mapDiv.appendChild(lightLevelDiv);
    }
    if(document.getElementById('loader') != null){
        mapDiv.appendChild(document.getElementById('loader'));
    }
    if(document.getElementById('side-panel-btn') != null){
        mapDiv.appendChild(document.getElementById('side-panel-btn'));
    }
    if(document.getElementById('info-pane') != null){
        mapDiv.appendChild(document.getElementById('info-pane'));
    }
    if(document.getElementById('values-pane') != null){
        mapDiv.appendChild(document.getElementById('values-pane'));
    }
    if(document.getElementById('values-pane-btn') != null){
        mapDiv.appendChild(document.getElementById('values-pane-btn'));
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
         if(features.geometry.type == 'MultiPolygon'){
           var coords = coordinates[0][0][0];
        }else{
           var coords = coordinates[0][0];

        }

        var msg = '';
        if(features['properties']['current-energy-efficiency']) {
            msg = '' + features['properties']['current-energy-efficiency'];
        }else{
            msg = '-';
        }
        var msg2 = '';
        if(features['properties']['potential-energy-efficiency']) {
            msg2 = '' + features['properties']['potential-energy-efficiency'];
        }else{
            msg2 = '-';
        }
        var msg3 = '';
        if(features['properties']['UPRN']) {
            msg3 = '' + features['properties']['UPRN'];
        }else{
            msg3 = '-';
        }

        var msg4 = '';
        if(coordinates != null){
            var coord_feature = coordinates;
            var msg4_all = '' + coord_feature;
            var msg4_arr = msg4_all.split(',');
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

         let popupHTML = '<div class="tab"><button class="tablinks" onclick="openEpc(event, \'Current\')">Current</button>'+
        '<button class="tablinks" onclick="openEpc(event, \'Potential\')">Potential</button>'+
        '<button class="tablinks" onclick="openEpc(event, \'Other\')">Other</button></div>'+
        '<div id="Current" class="tabcontent active"><p><strong>Current Efficiency: </strong> <span class="">' + msg + '<span></p></div>'+
        '<div id="Potential" class="tabcontent"><p><strong>Potential Efficiency: </strong> <span class="">' + msg2 + '<span></p></div>'+
        '<div id="Other" class="tabcontent"><p><strong>UPRN: </strong>' + features['properties']['UPRN'] + '</p>'+
        '<p><strong>Lat: </strong> ' + coords[1] + '<br ><strong>Long: </strong> ' + coords[0]+'</p></div>';

        var popup = new mapboxgl.Popup({ offset: [5, -30] })
            .setLngLat(coords)
            //.setHTML('<h3>EPC Info</h3><p><strong>Current Efficiency: </strong> <span class="">' + msg + '<span></p><p><strong>Potential Efficiency: </strong> <span class="">' + msg2 + '<span></p><p><strong>UPRN: </strong>' + features['properties']['UPRN'] + '</p><p><strong>Latitude: </strong> ' + coords[1] + '<br ><strong>Longitude: </strong> ' + coords[0]+'</p>')
            .setHTML(popupHTML)
            .addTo(map);

    });

    map.on('click', 'wardBoundaries', (e) => {

        $('#control-panel').show();
        $('#collapse1').collapse('show');

        const features = e.features[0];

        const coordinates = features.geometry.coordinates;
        if(features.geometry.type == 'MultiPolygon'){
           var coords = coordinates[0][0][0];
        }else{
           var coords = coordinates[0][0];

        }

        const epcRenderedFeatures = getRenderedFeatures('epc-layer');
        const boundaryPoints = features.geometry.coordinates[0];

        const wardEpcData = dataInDefinedArea(epcRenderedFeatures, boundaryPoints);

        var foundFeaturePolygons = wardEpcData.foundFeaturePolygons;
        var foundFeatures = wardEpcData.foundFeatures;
        var totalEPC = wardEpcData.totalEPC;
        var totalPotentialEPC = wardEpcData.totalPotentialEPC;
        var foundFeatureUprns = wardEpcData.foundFeatureUprns;
        var averageEfficiency = '';
        if(round(totalEPC / foundFeatures) > 0){
            averageEfficiency = round(totalEPC / foundFeatures);
        }
        var averagePotentialEfficiency = '';
        if(round(totalPotentialEPC / foundFeatures) > 0){
            averagePotentialEfficiency = round(totalPotentialEPC / foundFeatures);
        }

        let ward_id = features['properties']['FID'];
        let ward_24CD = features['properties']['WD24CD'];
        let ward_24NM = features['properties']['WD24NM'];
        let ward_BNG_E = features['properties']['BNG_E'];
        let ward_long = features['properties']['LONG'];
        let ward_lat = features['properties']['LAT'];
        let ward_area = features['properties']['Shape__Area'];
        let ward_length = features['properties']['Shape__Length'];

        var popup = new mapboxgl.Popup({ offset: [0, 0] })
            .setLngLat(coords)
            .setHTML('<h3>Ward Info</h3>'+
            '<p><strong>ID: </strong><span class="">' + ward_id + '<span></p>'+
            '<p><strong>WD24CD: </strong><span class="">' + ward_24CD + '<span></p>'+
            '<p><strong>WD24NM: </strong><span class="">' + ward_24NM + '<span></p>'+
            '<p><strong>EPC Features: </strong><span class="">' + foundFeatures + '<span></p>'+
            '<p><strong>Total EPC: </strong><span class="">' + totalEPC + '<span></p>'+
            '<p><strong>Total Potential EPC: </strong><span class="">' + totalPotentialEPC + '<span></p>'+
            '<p><strong>Average EPC: </strong><span class="">' + averageEfficiency + '<span></p>'+
            '<p><strong>Average Potential EPC: </strong><span class="">' + averagePotentialEfficiency + '<span></p>')
            .addTo(map);
        });

    map.on('click', 'lsoaChoropleth', (e) => {

        $('#control-panel').show();
        $('#collapse1').collapse('show');

        const features = e.features[0];
        console.log("features(all): "+ JSON.stringify(features));

        // Copy coordinates array
        const coordinates = features.geometry.coordinates;
        if(features.geometry.type == 'MultiPolygon'){
            var coords = coordinates[0][0][0];
        }else{
            var coords = coordinates[0][0];
        }
        console.log("coordinates: "+ coordinates);

        let lsoa_11NM = features['properties']['LSOA11NM'];
        let lsoa_11CD = features['properties']['LSOA11CD'];
        let lsoa_11NMW = features['properties']['LSOA11NMW'];
        let lsoa_area = features['properties']['Shape__Are'];
        let lsoa_length = features['properties']['Shape__Len'];
        let lsoa_comment = features['properties']['Project comment'];
        let lsoa_EBIGS = features['properties']['EBIGS area'];
        let lsoa_RESIDENT_POPULATION = features['properties']['RESIDENT_POPULATION'];
        let lsoa_CHILD_0_15_YRS = features['properties']['CHILD_0_15_YRS'];
        let lsoa_AGED_16_64_YRS = features['properties']['AGED_16_64_YRS'];
        let lsoa_AGED_65__YRS = features['properties']['AGED_65__YRS'];
        let lsoa_LIVES_IN_COMMUNAL_ESTABLISHMENT = features['properties']['LIVES_IN_COMMUNAL_ESTABLISHMENT'];
        let lsoa_PERSONS_WITH_LIMITING_LONG_TERM_CONDITION = features['properties']['PERSONS_WITH_LIMITING_LONG_TERM_CONDITION'];
        let lsoa_BORN_OVERSEAS = features['properties']['BORN_OVERSEAS'];
        let lsoa_WHITE = features['properties']['WHITE'];
        let lsoa_MULTIPLE_ETHNICITY = features['properties']['MULTIPLE_ETHNICITY'];
        let lsoa_ASIAN = features['properties']['ASIAN'];
        let lsoa_BLACK = features['properties']['BLACK'];
        let lsoa_ARAB_AND_OTHER = features['properties']['ARAB_AND_OTHER'];

        const epcRenderedFeatures = getRenderedFeatures('epc-layer');
        const boundaryPoints = features.geometry.coordinates[0];

        const lsoaEpcData = dataInDefinedArea(epcRenderedFeatures, boundaryPoints);

        var foundFeaturePolygons = lsoaEpcData.foundFeaturePolygons;
        var foundFeatures = lsoaEpcData.foundFeatures;
        var totalEPC = lsoaEpcData.totalEPC;
        var totalPotentialEPC = lsoaEpcData.totalPotentialEPC;
        var foundFeatureUprns = lsoaEpcData.foundFeatureUprns;

        var averageEfficiency = '';
        if(round(totalEPC / foundFeatures) > 0){
            averageEfficiency = round(totalEPC / foundFeatures);
        }
        var averagePotentialEfficiency = '';
        if(round(totalPotentialEPC / foundFeatures) > 0){
            averagePotentialEfficiency = round(totalPotentialEPC / foundFeatures);
        }

        var popup = new mapboxgl.Popup({ offset: [5, -30] })
        .setLngLat(coords)
        .setHTML('<h3>LSOA Info</h3>'+
            '<p><strong>11NM: </strong><span class="">' + lsoa_11NM + '<span></p>'+
            '<p><strong>11CD: </strong><span class="">' + lsoa_11CD + '<span></p>'+
            '<p><strong>EPC Features: </strong><span class="">' + foundFeatures + '<span></p>'+
            '<p><strong>Total EPC: </strong><span class="">' + totalEPC + '<span></p>'+
            '<p><strong>Total Potential EPC: </strong><span class="">' + totalPotentialEPC + '<span></p>'+
            '<p><strong>Average EPC: </strong><span class="">' + averageEfficiency + '<span></p>'+
            '<p><strong>Average Potential EPC: </strong><span class="">' + averagePotentialEfficiency + '<span></p>')
        .addTo(map);
    });

    function startSpinner() {
        document.getElementById("loader").style.visibility = "visible";
        map.on('idle', stopSpinner);
    }

    const stopSpinner = (e) => {
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
                        stops: [[0, '#000000'], [21, '#d4340d'], [39, '#f06e2d'], [55, '#f8b368'], [69, '#f0c713'], [81, '#8cc637'], [92, '#1bb359'], [100, '#02895d']]
                    },
                    'fill-extrusion-height': 30,
                    'fill-extrusion-opacity': 0.9,
                }
            });
        }

        if(loadExtras){
            if(!map.getSource('knowledgeq')){
                map.addSource('knowledgeq', {
                    type: 'geojson',
                    data: 'https://bear-rsg.github.io/diatomic/js/data/BKQ-2024-12.geojson'
                });
                map.addLayer({
                   'id': 'knowledge-quarter',
                   'source': 'knowledgeq',
                   'layout': {
                       'visibility': 'none'
                   },
                   'minzoom': 10,
                   'maxzoom': 17,
                   'type': 'fill',
                   'paint': {
                       'fill-color': '#fc7676',
                       'fill-outline-color': 'rgba(182, 0, 0, 0.9)',
                       'fill-opacity': 0.2
                   }
               });
               map.addLayer({
                   'id': 'knowledge-quarter_border',
                   'type': 'line',
                   'source': 'knowledgeq', // reference the data source
                   'layout': {
                       // Make the layer non-visible by default - turn on by checkbox toggle
                       'visibility': 'none',
                       'line-join': 'round',
                       'line-cap': 'round'
                   },
                   'minzoom': 10,
                   'maxzoom': 17,
                   'paint': {
                       'line-color': '#b60000',
                       'line-width': {
                           'type': 'exponential',
                           'stops': [
                               [11, 1],
                               [15, 2],
                           ]
                       },
                   }
               });
            }

            if(!map.getSource('heatmap')){
                map.addSource('heatmap', {
                    type: 'geojson',
                    data: 'https://bear-rsg.github.io/diatomic/js/data/heat-network-layer-epsg4326a.geojson'
                });
                map.addLayer({
                   'id': 'heatmap-layer',
                   'source': 'heatmap',
                   'layout': {
                       'visibility': 'none'
                   },
                   'minzoom': 10,
                   'maxzoom': 15,
                   'type': 'fill',
                   'paint': {
                       'fill-color': '#f23ed6',
                       'fill-outline-color': 'rgba(0, 0, 0, 0.2)',
                       'fill-opacity': 0.5
                   }
               });
            }

            if(!map.getSource('wards')){
                map.addSource('wards', {
                    type: 'geojson',
                    data: 'https://bear-rsg.github.io/diatomic/js/data/east-birmingham-inclusive-growth.geojson'
                });
                map.addLayer({
                    'id': 'wardBoundaries',
                    'type': 'fill',
                    'source': 'wards', // reference the data source
                    'layout': {
                        // Make the layer non-visible by default - turn on by checkbox toggle
                        'visibility': 'none',
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'minzoom': 10,
                    'maxzoom': 17,
                    'paint': {
                        'fill-color': ['feature-state', 'color'],
                        //'fill-color': '#385dce',
                        'fill-outline-color': 'rgba(0, 0, 0, 0.2)',
                        'fill-opacity': 0.2,
                    }
                });

                map.addLayer({
                    'id': 'wardBoundaries_borders',
                    'type': 'line',
                    'source': 'wards', // reference the data source
                    'layout': {
                        // Make the layer non-visible by default - turn on by checkbox toggle
                        'visibility': 'none',
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'minzoom': 10,
                    'maxzoom': 17,
                    'paint': {
                        'line-color': '#385dce', // blue color fill
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
            if(!map.getFeatureState({ id: 'features[0].id', source: 'wards' }).color) {
                map.setFeatureState({ id: 'features[0].id', source: 'wards' }, { color: makeRandomColor() });
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


    window.onload = function() {
        startSpinner();
    };

    function resetCanvas(canvasId){
        var removeID = "#"+canvasId;
        $(removeID).remove();
        $("<canvas id='" + canvasId + "'><canvas>").insertAfter( "#hist_options" );
        var selected_value = $("input[name='chart_type']:checked").val();
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
                foundSourceFeatures = map.querySourceFeatures('epc', {'sourceLayer': 'epc-layer'});
            }

            var foundSourceFeaturesCnt = foundSourceFeatures.length;
            var hist_eff_data = [];
            var hist_pot_data = [];
            if (foundSourceFeaturesCnt > 0){
                hist_eff_data = buildHistogramData(foundSourceFeatures, 'current-energy-efficiency');
                hist_pot_data = buildHistogramData(foundSourceFeatures, 'potential-energy-efficiency');
            }

            const currBgroundColour = [];
            const currLabelValues = [];

            for(var i=0; i < hist_eff_data.length; i++) {
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
                            bottom: 30
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

    // TIMESERIES
    function createCheckboxes() {

        // Select the container div
        var DISPLAY_OPTIONS = document.getElementById('data-display-opts');

        // Setting up options for checkboxes
        const AVAILABLE_DISPLAY_OPTIONS = [
            {
                id: 1,
                datatype: 'datapoints_net_demand',
                name: 'Net Demand',
                value: 'trace1',
                holder: 'datapoints_net_demand_div'
            },
            {
                id: 2,
                datatype: 'datapoints_generation',
                name: 'Generation',
                value: 'trace2',
                holder: 'datapoints_generation_div'
            },
            {
                id: 3,
                datatype: 'datapoints_import',
                name: 'Import',
                value: 'trace3',
                holder: 'datapoints_import_div'
            },
            {
                id: 4,
                datatype: 'datapoints_solar',
                name: 'Solar',
                value: 'trace4',
                holder: 'datapoints_solar_div'
            },
            {
                id: 5,
                datatype: 'datapoints_wind',
                name: 'Wind',
                value: 'trace5',
                holder: 'datapoints_wind_div'
            },
            {
                id: 6,
                datatype: 'datapoints_stor',
                name: 'STOR',
                value: 'trace6',
                holder: 'datapoints_stor_div'
            },
            {
                id: 7,
                datatype: 'datapoints_other',
                name: 'Other',
                value: 'trace7',
                holder: 'datapoints_other_div'
            }
        ];

        var SELECTED_DISPLAY_OPTION = 1; // update from displayOptions?

        for (const DISPLAY_OPTION of AVAILABLE_DISPLAY_OPTIONS) {

            const checkboxItem = document.createElement('div');
            const checkboxInput = document.createElement('input');
            const checkboxLabel = document.createElement('label');

            // Assign attributes
            checkboxItem.className = "div-flex-row form-check-inline toggletrigger";
            checkboxItem.id = DISPLAY_OPTION.holder;

            checkboxInput.className = "checkbox-data-type"
            checkboxInput.type = 'checkbox';
            checkboxInput.name = 'toggle-display-option';

            checkboxInput.id = DISPLAY_OPTION.datatype;
            checkboxInput.value = DISPLAY_OPTION.value;
            checkboxInput.checked = DISPLAY_OPTION.id === SELECTED_DISPLAY_OPTION;

            checkboxLabel.htmlFor = DISPLAY_OPTION.datatype;
            checkboxLabel.innerText = DISPLAY_OPTION.name;

            // Append the input and label elements to the checkboxItem div.
            checkboxItem.appendChild(checkboxInput);
            checkboxItem.appendChild(checkboxLabel);

            // Append the checkboxItem div to the containerItem div that will contain all the checkboxes.
            DISPLAY_OPTIONS.appendChild(checkboxItem);

        }

    }


    var leeMarstonDataURL = 'https://bear-rsg.github.io/diatomic/js/data/lea-marston_wmids.csv';

    var traceOptions = [
        {'csv_name': 'Net Demand', 'suffix': 'net_demand', 'color': '#17becf'},
        {'csv_name': 'Generation', 'suffix': 'generation', 'color':'#d40dd1'},
        {'csv_name': 'Import', 'suffix': 'import', 'color': '#c82f2f'},
        {'csv_name': 'Solar', 'suffix': 'solar', 'color': '#fbf868'},
        {'csv_name': 'Wind', 'suffix': 'wind', 'color': '#1508a6'},
        {'csv_name': 'STOR', 'suffix': 'stored', 'color': '#0b0b0b'},
        {'csv_name': 'Other', 'suffix': 'other', 'color': '#489341'}
    ];

    // Call the function to create and append checkboxes
    createCheckboxes();

    function timeSeriesDisplay(dataURL, traceOptions){

        var rawDataURL = dataURL;

        var dataOptions = {
                options: [

                ]
            };

        var xField = 'Date';
        var yField = 'All';

        var selectorOptions = {
            buttons: [{
                step: 'minutes',
                stepmode: 'backward',
                count: 1,
                label: '5mins'
            },
            {
                step: 'minutes',
                stepmode: 'backward',
                count: 30,
                label: '30mins'
            },
            {
                step: 'hours',
                stepmode: 'backward',
                count: 1,
                label: 'hour'
            }],
        };

        d3.csv(rawDataURL, function(err, rows){

            if(err) throw err;

            function unpack(rows, key) {

                return rows.map(function(row) { return row[key]; });

            }

            // Extracting values for the slider
            const datapoints_timestamp = unpack(rows, 'Timestamp');
            const datapoints_net_demand = unpack(rows, 'Net Demand');
            const datapoints_generation = unpack(rows, 'Generation');
            const datapoints_import = unpack(rows, 'Import');
            const datapoints_solar = unpack(rows, 'Solar');
            const datapoints_wind = unpack(rows, 'Wind');
            const datapoints_stor = unpack(rows, 'STOR');
            const datapoints_other = unpack(rows, 'Other');
            const num_datapoints = datapoints_timestamp.length - 1;

            const min_timestamp = new Date(Math.min.apply(null, datapoints_timestamp.map(function(e) {
                                    return new Date(e);
                                  })));
            const max_timestamp = new Date(Math.max.apply(null, datapoints_timestamp.map(function(e) {
                                      return new Date(e);
                                    })));

            const min_net_demand = Math.min(...datapoints_net_demand);
            const max_net_demand = Math.max(...datapoints_net_demand);

            function prepData(rows, selected_display_option) {

                var x = datapoints_timestamp;
                console.log('x:' + x);
                var y = datapoints_net_demand; //selected_display_option;
                console.log('y:' + y);
                console.log(rows.length)

                rows.forEach(function(datum, i) {
                    if(i % 100) return;

                    x.push(new Date(datum[xField]));
                    y.push(datum[yField]);
                });

                return [{
                    mode: 'lines',
                    x: x,
                    y: y
                }];
            }

            var trace1 = {
                type: "scatter",
                mode: "lines",
                name: "Net Demand",
                x: datapoints_timestamp,
                y: datapoints_net_demand,
                line: { color: "#17becf" }
            };
            var trace2 = {
                type: "scatter",
                mode: "lines",
                name: "Generation",
                x: datapoints_timestamp,
                y: datapoints_generation,
                line: { color: "#d40dd1" }
            };
            var trace3 = {
                type: "scatter",
                mode: "lines",
                name: "Import",
                x: datapoints_timestamp,
                y: datapoints_import,
                line: { color: "#c82f2f" }
            };
            var trace4 = {
                type: "scatter",
                mode: "lines",
                name: "Solar",
                x: datapoints_timestamp,
                y: datapoints_solar,
                line: { color: "#fbf868" }
            };
            var trace5 = {
                type: "scatter",
                mode: "lines",
                name: "Wind",
                x: datapoints_timestamp,
                y: datapoints_wind,
                line: { color: "#1508a6" }
            };
            var trace6 = {
                type: "scatter",
                mode: "lines",
                name: "Stored",
                x: datapoints_timestamp,
                y: datapoints_stor,
                line: { color: "#0b0b0b" }
            };
            var trace7 = {
                type: "scatter",
                mode: "lines",
                name: "Other",
                x: datapoints_timestamp,
                y: datapoints_other,
                line: { color: "#489341" }
            };

            const allTraces = { trace1, trace2, trace3, trace4, trace5, trace6, trace7 };

            var layout = {
                plot_bgcolor: "rgba(0,0,0,0)",
                paper_bgcolor: "rgba(0,0,0,0)",
                width: 900,
                height: 440,
                title: 'Lea Marston - GSP Time Series',
                font: {
                    //color: 'aqua' TODO: ALT COLOURS
                    color: '#333'
                },
                xaxis: {
                    //autorange: true,
                    range: [min_timestamp, max_timestamp],
                    rangeselector: {buttons: [
                        {
                          count: 30,
                          label: '30min',
                          step: 'minute',
                          stepmode: 'backward'
                        },
                        {
                          count: 1,
                          label: '1h',
                          step: 'hour',
                          stepmode: 'backward'
                        },
                        {
                          count: 1,
                          label: '1d',
                          step: 'day',
                          stepmode: 'backward'
                        },
                        {
                          count: 7,
                          label: '1w',
                          step: 'day',
                          stepmode: 'backward'
                        },
                        {
                          count: 1,
                          label: '1m',
                          step: 'month',
                          stepmode: 'backward'
                        },
                        /*{
                          count: 3,
                          label: '3m',
                          step: 'month',
                          stepmode: 'backward'
                        },*/

                        {step: 'all'}

                    ]},
                    rangeslider: {range: [min_timestamp, max_timestamp] },
                    type: 'date'
                },

                yaxis: {
                    autorange: true,
                    range: [min_net_demand, max_net_demand],
                    type: 'linear'
                }

            };


            // Function to update plot based on selected checkboxes
            function updatePlot() {
                const selectedTraces = [];
                document.querySelectorAll('#data-display-opts input[type="checkbox"]').forEach(checkbox => {
                    if (checkbox.checked) {
                        selectedTraces.push(allTraces[checkbox.value]);
                    }
                });

                // Get date range from datepickers
                var startDate = document.getElementById('start-date').value;
                var endDate = document.getElementById('end-date').value;

                if(startDate && endDate) {
                    //alert('updating plot with dates: ' + new Date(startDate) + ' and ' + new Date(endDate));
                    layout.xaxis.range = [new Date(startDate), new Date(endDate)];
                } else {
                    layout.xaxis.range = [min_timestamp, max_timestamp];
                }
                //alert('updating plot');
                // Update plot with the selected traces
                Plotly.react('gsp-plot', selectedTraces, layout);
            }

            // Add event listeners to checkboxes
            document.querySelectorAll('#data-display-opts input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', updatePlot);
            });

            // Add event listeners for date inputs
            document.getElementById('start-date').addEventListener('change', updatePlot);
            document.getElementById('end-date').addEventListener('change', updatePlot);

            // Initial plot
            updatePlot();
        });

    }

    $(document).ready(function(){

        timeSeriesDisplay(leeMarstonDataURL, traceOptions);

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

        //$('#threedmap_div').insertAfter($(".mapboxgl-ctrl-top-left div:last"));
        $('#dimensionstoggle_div').insertAfter($(".mapboxgl-ctrl-top-left div:last"));

        $('#control-panel').hide();

        $('#dimensionstoggle_div').click(function(){
            if(map.getPitch() != 0){
                flatView();
            }else{
                angleView();
            }
        });

        $('#threedmap_div').click(function(){
            const clickedLayer = 'google-3d-tiles';
            const visibility = map.getLayoutProperty(
                clickedLayer,
                'visibility'
            );

            if (visibility === 'visible') {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            } else {
                map.setLayoutProperty(
                    clickedLayer,
                    'visibility',
                    'visible'
                );
                //map.moveLayer('chargepoints', 'google-3d-tiles');

            }

        });

        //$('#basemap_div').insertAfter($(".mapboxgl-ctrl-top-left div:last"));
        //$( "#menu" ).hide();

        //$('#basemap_div').click(function(){
        //    $('#menu').toggle('slow');
        //});
        $('.open_panel').click(function(){
            $('#control-panel').toggle();
            $('#potChart').addClass('hidden');
        });

        $('#time_series_gsp_btn').click(function(){
            $('#time_series_gsp').toggle('slow');
        });
        $('#time_series_gsp').toggle('slow');

        $('.closebtn').click(function(){
            $('#control-panel').toggle('slow');
        });

        $('.closeinfobtn').click(function(){
            $('#info-pane').toggle('slow');
        });$('.closevaluesbtn').click(function(){
            $('#values-pane').toggle('slow');
            $('#values-pane-btn').toggle('slow');
        });

        $('#info-pane-btn').click(function(){
            $('#info-pane').toggle('slow');
        });

        $('#values-pane-btn').click(function(){
            $('#values-pane').toggle('slow');
            $('#values-pane-btn').toggle('slow');
        });
        $('#values-pane-btn').toggle('slow');

        $('#hist_options').change(function(){
            var selected_value = $("input[name='chart_type']:checked").val();
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
        var checkbox_link4 = document.querySelector('#heatmaptogglediv');
        var checkbox_link5 = document.querySelector('#knowledgetogglediv');


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
                zoomHigherFlat();
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

            // Toggle layer visibility by changing the layout object's visibility property.
            if(toggle_on) {
                map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                map.setLayoutProperty('wardBoundaries_borders', 'visibility', 'visible');
                zoomHigherFlat();
            } else {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                map.setLayoutProperty('wardBoundaries_borders', 'visibility', 'none');
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

        checkbox_link4.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();

            if($(this).attr('id') == 'heatmaptogglediv'){
                checkbox_layer = 'heatmap-layer';
            }

            var clickedLayer = checkbox_layer;

            var is_active = $(this).find('.ui-switcher').attr('aria-checked');
            var toggle_on = false;
            if(is_active == 'true'){
                toggle_on = true;
            }

            // Toggle layer visibility by changing the layout object's visibility property.
            if(toggle_on) {
                map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                zoomHigherFlat();
            } else {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            }
        };

        checkbox_link5.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();

            if($(this).attr('id') == 'knowledgetogglediv'){
                checkbox_layer = 'knowledge-quarter';
            }

            var clickedLayer = checkbox_layer;

            var is_active = $(this).find('.ui-switcher').attr('aria-checked');
            var toggle_on = false;
            if(is_active == 'true'){
                toggle_on = true;
            }

            // Toggle layer visibility by changing the layout object's visibility property.
            if(toggle_on) {
                map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                map.setLayoutProperty('knowledge-quarter_border', 'visibility', 'visible');
                zoomHigherFlat();
            } else {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                map.setLayoutProperty('knowledge-quarter_border', 'visibility', 'none');
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
