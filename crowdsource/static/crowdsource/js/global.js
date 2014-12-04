define(["esri/map",
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "dijit/layout/BorderContainer",
        "dijit/layout/ContentPane",
        "dojo/parser",
        "dojo/domReady!"],
        function (Map, ArcGISDynamicMapServiceLayer, BorderContainer, ContentPane, parser) {
            var map;
            var layers;
            var demLayer

            parser.parse();

            demURL = "http://101.6.54.28:6080/arcgis/rest/services/gdn/GDEM/MapServer";

            layers = [
            {
                id: 1,
                url: "http://101.6.54.28:6080/arcgis/rest/services/gdn/Hydro30/MapServer",
                name: "清华Hydro30",
                group: "数字河网",
                visible: true
            }];
            
            map = new Map("map", {
                // center: [0, 0],
                center: user_center,
                zoom: 10,
                basemap: "satellite",
                logo: false,
                sliderStyle: "small"
            });

            layers.sort(function layerorder(a, b) {
                return a.id - b.id;
            })
            for (var i = 0; i < layers.length; i++) {
                var layer = new ArcGISDynamicMapServiceLayer(layers[i].url, { id: layers[i].name, visible: layers[i].visible });
                map.addLayer(layer);
            }
            var groups = {};
            for (var i = 0; i < layers.length; i++) {
                group = layers[i].group;
                if (group in groups) {
                    groups[group].append(layers[i]);
                }
                else {
                    groups[group] = [layers[i]];
                }
            }
            var rightPane = dojo.byId("rightPane");
            for (group in groups) {
                var grouplayers = groups[group];
                var groupDiv = document.createElement("div");
                groupDiv.className = "layerGroup";
                groupDiv.appendChild(document.createTextNode(group));
                rightPane.appendChild(groupDiv);
                for (i in groups[group]) {
                    var layer = grouplayers[i];
                    var layerDiv = document.createElement("div");
                    layerDiv.className = "layer";
                    var checkbox = document.createElement("input");
                    checkbox.name = layer.name;
                    checkbox.type = "checkbox";
                    if (layer.visible) {
                        checkbox.setAttribute(["checked"], ["checked"]);
                    }
                    dojo.connect(checkbox, "onchange", function (e) {
                        var src = e.target || window.event.srcElement;
                        var changelayer = map.getLayer(src.name);
                        changelayer.setVisibility(!changelayer.visible);
                    })
                    layerDiv.appendChild(checkbox);
                    layerDiv.appendChild(document.createTextNode(layer.name));
                    rightPane.appendChild(layerDiv);
                }
            }

            return {
                map: map,
                layers: layers,
                demURL: demURL
            };
        })