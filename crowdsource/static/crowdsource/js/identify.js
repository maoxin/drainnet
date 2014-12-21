﻿function updateRiverName() {
    var jsonobject = { "河段名称": dojo.byId("name_update").value };
    var data = JSON.stringify(jsonobject);
    var xmlhttp;
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
    }
    else {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            alert(xmlhttp.readyState);
        }
    }
    xmlhttp.open("POST","http://121.41.106.13:8000/crowdsource/river_name_input/", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(data);
}

require([
    "js/global",
    "dojo/on",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    'dojo/_base/declare',
    "esri/layers/GraphicsLayer",
    "esri/geometry/webMercatorUtils",
    "esri/graphic",
    "esri/tasks/locator",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters"
], function (
    global,
    on,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    Color,
    declare,
    GraphicsLayer,
    webMercatorUtils,
    Graphic,
    Locator,
    IdentifyTask,
    IdentifyParameters) {

    var identifyConfig = {
        active: false,
        showXY: true,
        showAddress: true,
        showZ: true,
        inputRiverName: true,
        showRiver: true
    }

    var IdentifySwitch = dojo.byId("IdentifySwitch");
    var identifyHandler;
    var circleSymbol = new SimpleMarkerSymbol(
                    SimpleMarkerSymbol.STYLE_CIRCLE,
                    10,
                    new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 0, 255, 0.5]),
                    8),
                    new Color([0, 0, 255])
                    );
    var lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 0]), 3);

    //选择开关
    on(IdentifySwitch, "click", function (e) {
        identifyConfig.active = !identifyConfig.active;
        if (identifyConfig.active) {
            IdentifySwitch.style.border = "2px solid #FFF";
            IdentifySwitch.style.margin = "-2px";
            e.stopPropagation();
            identifyHandler = on(global.map, "click", mapClick);
        }
        else {
            IdentifySwitch.style.border = "none";
            IdentifySwitch.style.margin = "0px";
            identifyHandler.remove();
            global.map.infoWindow.hide();
        }
    });

    on(global.map.infoWindow, "hide", function () {
        global.map.graphics.clear();
    })

    //定义类IdentifyControl控制整个查询窗体
    declare("IdentifyControl", null, {
        infoWindow: null,
        identifyGroup: [],
        constructor: function (infowindow) {//构造方法，搭建一个infowindow
            this.infoWindow = infowindow;
        },
        add: function (identify) {
            this.identifyGroup.push(identify);
            identify.control = this;
        },
        execute: function (mapPoint) {//捕获点击事件
            for (var i = 0; i < this.identifyGroup.length; i++) {
                this.identifyGroup[i].execute(mapPoint);
            }
        },
        refresh: function () {//设置标题的内容
            var str = "<table id = \"InfoWindow\">"
            for (var i = 0; i < this.identifyGroup.length; i++) {
                var identifyItem = this.identifyGroup[i];
                var title = identifyItem.title;
                var content = identifyItem.content;
                str = str + "<tr><td class=\"title\">" + title + "</td><td class=\"content\">" + content + "</td></tr>";
            }
            str = str + "</table>";
            this.infoWindow.setTitle("查询");
            this.infoWindow.setContent(str);

            //on(document.getElementById("submit"), "click", function () {
               // alert("2333");
           // })
        },
        clear: function () {
            for (var i = 0; i < this.identifyGroup.length; i++) {
                this.identifyGroup[i].clear();
            }
        }
    });
    
    //定义类IdentifyBase显示所有标题和对应内容，也是下面所有类的父类
    declare("IdentifyBase", null, {
        title: "标题",
        content: "内容",
        control: null,
        execute: function (mapPoint) {
        },
        notify: function () {//notify调用refresh
            this.control.refresh();
        },
        clear: function () {
        }
    });
    
    //定义类CoordinateIdentify显示坐标
    declare("CoordinateIdentify", IdentifyBase, {
        title: "坐标",
        content: "请稍候...",
        execute: function (mapPoint) {
            var locationGeographic = webMercatorUtils.webMercatorToGeographic(mapPoint);
            this.content = "(" + Math.round(locationGeographic.x * 10000) / 10000 + ", " + Math.round(locationGeographic.y * 10000) / 10000 + ")";
            this.notify();
        },
        clear: function () {
            this.title = "坐标";
            this.content = "请稍候...";
        }
    });

    //定义类AddressIdentify显示地址
    declare("AddressIdentify", IdentifyBase, {
        title: "地址",
        content: "请稍候...",
        locatorIdentify: null,
        constructor: function (severURL) {
            this.locatorIdentify = new Locator(severURL)
        },
        execute: function (mapPoint) {
            var locationGeographic = webMercatorUtils.webMercatorToGeographic(mapPoint);
            this.locatorIdentify.locationToAddress(locationGeographic, 1000);
            var that = this;
            var onComplete = function (evt) {
                if (evt.address.address) {
                    var address = evt.address.address.Address;
                    that.content = address;
                    that.inherited('notify', arguments);
                }
            };
            var onError = function (evt) {
                that.content = "无法获取";
                that.inherited('notify', arguments);
            };
            this.locatorIdentify.on("location-to-address-complete", onComplete);
            this.locatorIdentify.on("error", onError);
        },
        clear: function () {
            this.title = "地址";
            this.content = "请稍候...";
        }
    });

    //定义类ElevIdentify显示高程
    declare("ElevIdentify", IdentifyBase, {
        title: "高程",
        content: "请稍候...",
        demIdentify: null,
        layerIds: [],
        map: null,
        constructor: function (serverURL, layerIds, map) {
            this.demIdentify = new IdentifyTask(serverURL);
            this.layerIds = layerIds;
            this.map = map;
        },
        execute: function (mapPoint) {
            var demIdentifyParams = new IdentifyParameters();
            demIdentifyParams.tolerance = 0;
            demIdentifyParams.returnGeometry = false;
            demIdentifyParams.layerIds = this.layerIds;
            demIdentifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
            demIdentifyParams.width = this.map.width;
            demIdentifyParams.height = this.map.height;
            demIdentifyParams.geometry = mapPoint;
            demIdentifyParams.mapExtent = this.map.extent;
            var that = this;
            var onComplete = function (idResults) {
                var z = idResults[0]["feature"]["attributes"]["Pixel Value"];
                z = Math.round(z * 100) / 100.0;
                that.content = z + " m";
                that.inherited('notify', arguments);
            };
            var onError = function () {
                that.content = "无法获取";
                that.inherited('notify', arguments);
            }
            this.demIdentify.execute(demIdentifyParams, onComplete, onError);
        },
        clear: function () {
            this.title = "高程";
            this.content = "请稍候...";
        }
    });

    //定义类inputRiverName显示或输入河流名称
    declare("InputRiverName", IdentifyBase, {
        title: "河段名称",
        content:"请稍候..." ,
        execute: function (mapPoint) {
            var that = this;
            this.content ="<input id='name_update' type='text' name='name'>"
                 + "<button id='submit' onclick='updateRiverName()'>" + "提交" + "</button>";
            that.notify();
        },
        clear: function () {
            this.title = "河段名称";
            this.content = "请稍候...";
        },
    });

    //定义类RiverIdentify显示河段信息
    declare("RiverIdentify", IdentifyBase, {
        title: "河段信息",
        content: "请稍候...",
        riverIdentify: null,
        map: null,
        constructor: function (serverURL, map) {
            this.riverIdentify = new IdentifyTask(serverURL);
            this.map = map;
        },
        execute: function (mapPoint) {
            var riverIdentifyParams = new IdentifyParameters();
            riverIdentifyParams.tolerance = 5;
            riverIdentifyParams.returnGeometry = true;
            riverIdentifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
            riverIdentifyParams.width = this.map.width;
            riverIdentifyParams.height = this.map.height;
            riverIdentifyParams.geometry = mapPoint;
            riverIdentifyParams.mapExtent = this.map.extent;
            var that = this;
            this.riverIdentify.execute(riverIdentifyParams, function (idResults) {
                if (idResults.length <= 0) {
                    that.content = "未选中任何河段";
                }
                else {
                    var idResult = idResults[0];
                    var feature = idResult.feature;
                    feature.setSymbol(lineSymbol);
                    that.map.graphics.add(feature);
                    var attributes = feature.attributes;
                    var str = '<table class="RiverAttributes"><tr><th>属性</th><th>值</th></tr>';
                    for (var name in attributes) {
                        var value = attributes[name];
                        str = str + '<tr><td class="name">' + name + '</td><td class="value">' + value + '</td></tr>';
                    }
                    str = str + '</table>'
                    that.content = str;
                }
                that.notify();
            }, function () {
                that.content = "无法获取";
                that.notify();
            });
        },
        clear: function () {
            this.title = "河段信息";
            this.content = "请稍候...";
        }
    });


    var identifyControl = new IdentifyControl(global.map.infoWindow);
    if (identifyConfig.showXY)
        identifyControl.add(new CoordinateIdentify());
    if (identifyConfig.showAddress)
        identifyControl.add(new AddressIdentify("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"));
    if (identifyConfig.showZ)
        identifyControl.add(new ElevIdentify(global.demURL, [3, ], global.map));
    if (identifyConfig.inputRiverName)
        identifyControl.add(new InputRiverName());
    if (identifyConfig.showRiver)
        identifyControl.add(new RiverIdentify(global.layers[0].url, global.map));

    debug = identifyControl;

    function mapClick(evt) {
        identifyControl.clear();
        global.map.graphics.clear();
        var location = evt.mapPoint;
        var graphic = new Graphic(location, circleSymbol, null, null);
        global.map.graphics.add(graphic);
        var screenPnt = evt.screenPoint;
        global.map.infoWindow.show(screenPnt, global.map.getInfoWindowAnchor(screenPnt));
        identifyControl.execute(location);
    }

});