//点击：identifyCrontrol.add->identifyCrontrol.clear()->各子类execute()->
//河段信息、地址、高程的查询（特征提取回调函数中放入infoWindow更新）->
//回调函数执行完后identifyCrontrol.refresh()

var ObjectID;//河段ID
var SelectedObjectID; // used when correct location
var X;//点坐标
var Y;
var isModifying = false;//标记是否在选点修改
var noRiver = true;//标记是否选中了河段
var lineFeature;//记录设置好河段线高亮的feature以便随时高亮
var control//记录identifyControl以便随时操作infoWindow

var identifyConfig = {//显示何种信息的判断标志
    active: true,
    showXY: true,
    showAddress: true,
    showZ: true,
    showRiverName: true,
    showPoint: true,
    showDeleteRiver: true
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
    /*var IdentifySwitch = dojo.byId("IdentifySwitch");//选择开关
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
    });*/

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
            str = "<table id = \"InfoWindow\">";
            if (noRiver == false) {
                for (var i = 0; i < this.identifyGroup.length; i++) {
                    var identifyItem = this.identifyGroup[i];
                    var title = identifyItem.title;
                    var content = identifyItem.content;
                    str = str + "<tr><td class=\"title\">" + title + "</td><td class=\"content\">" + content + "</td></tr>";
                }
            }
            else str += "未选中任何河段";
            str = str + "</table>";
            this.infoWindow.setTitle(isModifying ? "请在地图上选择点" : "查询");
            this.infoWindow.setContent(str);
        },
        clear: function () {//初始化infoWindow内容
            this.infoWindow.setTitle(isModifying ? "请在地图上选择点" : "查询");
            this.infoWindow.setContent("请稍候...");
            for (var i = 0; i < this.identifyGroup.length; i++) {
                this.identifyGroup[i].clear();
            }
        }
    });

    //定义类RiverIdentify搜索河段信息
    declare("RiverIdentify",null, {
        riverIdentify: null,
        map: null,
        constructor: function (serverURL, map) {
            this.riverIdentify = new IdentifyTask(serverURL);
            this.map = map;
        },
        execute: function (mapPoint,identifyControl) {
            var riverIdentifyParams = new IdentifyParameters();
            riverIdentifyParams.tolerance = 5;
            riverIdentifyParams.returnGeometry = true;
            riverIdentifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
            riverIdentifyParams.width = this.map.width;
            riverIdentifyParams.height = this.map.height;
            riverIdentifyParams.geometry = mapPoint;
            riverIdentifyParams.mapExtent = this.map.extent;
            var that = this;
            this.riverIdentify.execute(riverIdentifyParams, function (idResults) {//回调函数，只有查询到IdentifyResult[]才执行
                if (idResults.length <= 0) {
                    noRiver = true;//改变标记
                }
                else {
                    noRiver = false;
                    var idResult = idResults[0];
                    var feature = idResult.feature;
                    feature.setSymbol(lineSymbol);//设置河段线高亮
                    lineFeature = feature;//记录feature
                    that.map.graphics.add(feature);
                    var attributes = feature.attributes;
                    for (var name in attributes) {
                        var value = attributes[name];
                        if (name == "OBJECTID") ObjectID = value;//提取OBJECTID
                    }
                }
                identifyControl.execute(mapPoint);//infoWindow内容改变，在回调函数中保证显示内容正确
                identifyControl.refresh();
            });
        }
    });

    //定义类IdentifyBase显示所有标题和对应内容，也是下面所有类的父类
    declare("IdentifyBase", null, {
        title: "标题:",
        content: "内容",
        control: null,//指向identifyControl
        execute: function (mapPoint) {
        },
        clear: function () {
            this.content = "请稍候...";
        }
    });

    //定义类CoordinateIdentify显示坐标
    declare("CoordinateIdentify", IdentifyBase, {
        title: "坐标:",
        content: "请稍候...",
        execute: function (mapPoint) {
            var locationGeographic = webMercatorUtils.webMercatorToGeographic(mapPoint);
            X = Math.round(locationGeographic.x * 10000) / 10000;
            Y = Math.round(locationGeographic.y * 10000) / 10000;
            this.content = "(" + X + ", " + Y + ")";
        }
    });

    //定义类AddressIdentify显示地址
    declare("AddressIdentify", IdentifyBase, {
        title: "地址:",
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
                    identifyControl.refresh();
                }
            };
            var onError = function (evt) {
                that.content = "无法获取";
                identifyControl.refresh();
            };
            this.locatorIdentify.on("location-to-address-complete", onComplete);
            this.locatorIdentify.on("error", onError);
        }
    });

    //定义类ElevIdentify显示高程
    declare("ElevIdentify", IdentifyBase, {
        title: "高程:",
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
                identifyControl.refresh();
            };
            var onError = function () {
                that.content = "无法获取";
                identifyControl.refresh();
            }
            this.demIdentify.execute(demIdentifyParams, onComplete, onError);
        }
    });

    //定义类inputRiverName显示或输入河流名称
    declare("InputRiverName", IdentifyBase, {
        title: "河段名称:",
        content: "请稍候...",
        execute: function (mapPoint) {
            this.content = "<input id='name_update' type='text' size='10'>"
                + "<button id='submitName' onclick='updateRiverName()'>" + "提交" + "</button>";
        }
    });

    //定义类deleteRiver显示或输入河流名称
    declare("DeleteRiver", IdentifyBase, {
        title: "删除河段:",
        content: "请稍候...",
        execute: function (mapPoint) {
            this.content = "<button id='delete_River' onclick='deleteThisRiver()'>" + "删除" + "</button>";
        }
    });

    //定义类ModifyPoint显示或输入河流名称
    declare("ModifyPoint", IdentifyBase, {
        title: "修改点:",
        content: "请稍候...",
        execute: function (mapPoint) {
            if (isModifying == false) this.content = "<button id='submitPoint' onclick='updatePoint()'>" + "选择修改" + "</button>";
            else this.content = "<button id='submitPointEnd' onclick='updatePointEnd()'>" + "修改完成" + "</button>";
        }
    });

    var identifyControl = new IdentifyControl(global.map.infoWindow);
    var riverIdentify = new RiverIdentify(global.layers[0].url, global.map);
    var coordinateIdentify = new CoordinateIdentify();
    var addressIdentify = new AddressIdentify("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
    var elevIdentify = new ElevIdentify(global.demURL, [3, ], global.map);
    var inputRiverName = new InputRiverName();
    var deleteRiver = new DeleteRiver();
    var modifyPoint = new ModifyPoint();

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
        if (identifyConfig.showDeleteRiver)
            identifyControl.add(deleteRiver);
        if (identifyConfig.showPoint)
            identifyControl.add(modifyPoint);
    }

    var identifyHandler;//点击图层事件
    identifyHandler = on(global.map, "click", mapClick);//生成一个点击事件，处理函数为mapClick
    function mapClick(evt) {//点击事件处理函数
        identifyControl.clear();//初始化为"请稍候..."
        initializeInfo();//清空
        addInfo();//添加信息
        global.map.graphics.clear();//清除GraphicsLayer中原有的graphic对象
        var location = evt.mapPoint;//点对象
        var graphic = new Graphic(location, circleSymbol, null, null);
        global.map.graphics.add(graphic);
        var screenPnt = evt.screenPoint;
        global.map.infoWindow.show(screenPnt, global.map.getInfoWindowAnchor(screenPnt));//显示infoWindow
        if (isModifying == true) {
            global.map.graphics.add(lineFeature);//河段线保持高亮
            identifyControl.execute(location);//infoWindow内容改变
            identifyControl.refresh();
            conveyPointXY();//传输点的坐标           
        }
        else riverIdentify.execute(location, identifyControl);//先加载完河段信息再显示输入，避免河段ID传输错误
        control = identifyControl;//记录identifyControl
    }

});