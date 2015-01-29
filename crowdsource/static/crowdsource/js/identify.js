//点击：identifyCrontrol.add->identifyCrontrol.clear()->identifyCrontrol.execute()->
//各子类execute()->各子类notify()->identifyCrontrol.refresh()

var ObjectID;//河段ID
var SelectedObjectID; // used when correct location
var X;//点坐标
var Y;
var isModifying = false;//标记是否在选点修改
var lineFeature;//记录设置好河段线高亮的feature以便随时高亮

var identifyConfig = {//显示何种信息的判断标志
    active: false,
    showXY: true,
    showAddress: true,
    showZ: true,
    showRiverName: true,
    showPoint:true,
    showRiver: true
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

    var IdentifySwitch = dojo.byId("IdentifySwitch");//选择开关
    var identifyHandler;//与选择开关捆绑的的点击图层事件
    var circleSymbol = new SimpleMarkerSymbol(//点击鼠标点的高亮
                    SimpleMarkerSymbol.STYLE_CIRCLE,
                    10,
                    new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 0, 255, 0.5]),
                    8),
                    new Color([0, 0, 255])
                    );
    //河段线高亮
    var lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 0]), 3);

    //选择点的开关
    on(IdentifySwitch, "click", function (e) {
        identifyConfig.active = !identifyConfig.active;
        if (identifyConfig.active) {//开关边框高亮
            IdentifySwitch.style.border = "2px solid #FFF";
            IdentifySwitch.style.margin = "-2px";
            e.stopPropagation();
            identifyHandler = on(global.map, "click", mapClick);//生成一个点击事件，处理函数为mapClick
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
        identifyGroup: [],//查询信息组
        constructor: function (infowindow) {//构造方法，搭建一个infowindow
            this.infoWindow = infowindow;
        },
        add: function (identify) {//添加每一种查询信息的对象至查询信息组
            this.identifyGroup.push(identify);
            identify.control = this;
        },
        execute: function (mapPoint) {//获取点的属性信息
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
            this.infoWindow.setTitle(isModifying ? "请在地图上选择点" : "查询");
            this.infoWindow.setContent(str);

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
        control: null,//指向identifyControl
        execute: function (mapPoint) {
        },
        notify: function () {//notify调用refresh
            this.control.refresh();//控制窗口更新infoWindow信息
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
            X = Math.round(locationGeographic.x * 10000) / 10000;
            Y = Math.round(locationGeographic.y * 10000) / 10000;
            this.content = "(" + X + ", " + Y + ")";
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
        content: "请稍候...",
        execute: function (mapPoint) {
            var that = this;
            this.content = "<input id='name_update' type='text' name='name'>"
             + "<button id='submitName' onclick='updateRiverName()'>" + "提交" + "</button>";
            that.notify();
        },
        clear: function () {
            this.title = "河段名称";
            this.content = "请稍候...";
        },
    });

    //定义类inputRiverName显示或输入河流名称
    /*declare("InputRiverName", IdentifyBase, {
        title: "河段名称",
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
                    feature.setSymbol(lineSymbol);//设置河段线高亮
                    lineFeature = feature;//记录feature
                    that.map.graphics.add(feature);
                    var attributes = feature.attributes;
            that.notify();
        },
        clear: function () {
            this.title = "河段名称";
            this.content = "请稍候...";
        },
    });*/

    //定义类ModifyPoint显示或输入河流名称
    declare("ModifyPoint", IdentifyBase, {
        title:"修改点",
        content: "请稍候...",
        execute: function (mapPoint) {
            var that = this;
            if (isModifying == false) this.content = "<button id='submitPoint' onclick='updatePoint()'>" + "选择修改" + "</button>";
            else this.content = "<button id='submitPointEnd' onclick='updatePointEnd()'>" + "修改完成" + "</button>";           
            that.notify();
        },
        clear: function () {
            this.title = "修改点";
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
                    feature.setSymbol(lineSymbol);//设置河段线高亮
                    lineFeature = feature;//记录feature
                    that.map.graphics.add(feature);
                    var attributes = feature.attributes;
                    var str = '<table class="RiverAttributes"><tr><th>属性</th><th>值</th></tr>';
                    for (var name in attributes) {
                        var value = attributes[name];
                        if (name == "OBJECTID") ObjectID = value;//提取OBJECTID
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
    var coordinateIdentify = new CoordinateIdentify();
    var addressIdentify = new AddressIdentify("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
    var elevIdentify = new ElevIdentify(global.demURL, [3, ], global.map);
    var inputRiverName = new InputRiverName();
    var modifyPoint = new ModifyPoint();
    var riverIdentify = new RiverIdentify(global.layers[0].url, global.map);

    function initializeInfo() {//清空infoWindow显示的信息
        while (identifyControl.identifyGroup.pop() != undefined) { }
    }
    function addInfo() {//infoWindow添加信息元素
        if (identifyConfig.showXY)
            identifyControl.add(coordinateIdentify);
        if (identifyConfig.showAddress)
            identifyControl.add(addressIdentify);
        if (identifyConfig.showZ)
            identifyControl.add(elevIdentify);
        if (identifyConfig.showRiverName)
            identifyControl.add(inputRiverName);
        if (identifyConfig.showPoint)
            identifyControl.add(modifyPoint);
        if (identifyConfig.showRiver)
            identifyControl.add(riverIdentify);
    }

    function mapClick(evt) {//点击事件处理函数
        initializeInfo();//清空
        addInfo();//添加信息
        identifyControl.clear();//初始化为“请稍后”
        global.map.graphics.clear();//清除GraphicsLayer中原有的graphic对象
        var location = evt.mapPoint;//点对象
        var graphic = new Graphic(location, circleSymbol, null, null);
        global.map.graphics.add(graphic);
        var screenPnt = evt.screenPoint;
        global.map.infoWindow.show(screenPnt, global.map.getInfoWindowAnchor(screenPnt));
        identifyControl.execute(location);//控制窗口显示infoWindow
        if (isModifying == true) {
            conveyPointXY();//传输点的坐标
            global.map.graphics.add(lineFeature);//河段线保持高亮
        }
    }

});