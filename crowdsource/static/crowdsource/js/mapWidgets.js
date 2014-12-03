require([
    "js/global",
    "esri/dijit/Scalebar",
    "esri/dijit/BasemapGallery",
    "esri/dijit/Basemap",
    "esri/dijit/BasemapLayer",
    "esri/dijit/Geocoder",
    "esri/dijit/HomeButton",
    "esri/dijit/LocateButton"],
    function (global, Scalebar, BasemapGallery, Basemap, BasemapLayer, Geocoder, HomeButton, LocateButton) {

        //ScalBar
        var scalebar = Scalebar({
            map: global.map,
            scalebarUnit: "metric"
        });

        //BaseMap
        var basemapGallery = new BasemapGallery({
            showArcGISBasemaps: true,
            map: global.map
        }, dojo.byId("basemapGallery"));
        var dem = new Basemap({
            layers: [new BasemapLayer({
                url: global.demURL
            })],
            title: "数字高程模型",
            thumbnailUrl: "images/dem.jpg"
        });
        basemapGallery.add(dem);
        basemapGallery.startup();
        dojo.connect(basemapGallery.domNode, "onclick", function () {
            basemapChange();
        });

        //search
        var geocoder = new Geocoder({
            map: global.map,
            autoComplete: true,
        }, dojo.byId("search"));
        geocoder.startup();

        //HomeButton
        var home = new HomeButton({
            map: global.map
        }, dojo.byId("HomeButton"));
        home.startup();

        //locateButton
        var geoLocate = new LocateButton({
            map: global.map
        }, dojo.byId("LocateButton"));
        geoLocate.startup();
    })