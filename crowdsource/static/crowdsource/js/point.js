//开启选择点功能的相应函数
function updatePoint() {
    //设置infoWindow以下信息不显示
    SelectedObjectID = ObjectID;
    identifyConfig.showAddress = false;
    identifyConfig.showZ = false;
    identifyConfig.showRiverName = false;
    identifyConfig.showRiver = false;
    isModifying = true;//进入选点状态
    dojo.byId("submitPoint").disabled = true;

    //向服务器传输河段ID
    // var jsonobject = { "河段ID": ObjectID };//json对象
    // var data = JSON.stringify(jsonobject);//转码
    // var xmlhttp;
    // xmlhttp = new XMLHttpRequest();
    // xmlhttp.onreadystatechange = function () {
        // if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            // alert(xmlhttp.readyState);
        // }
    // }
    // xmlhttp.open("POST", "url", true);
    // xmlhttp.open("POST", local_host + "crowdsource/fix_point_input/", true);
    // xmlhttp.setRequestHeader("Content-type", "application/json");//传送json的头部设置
    // xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8")
    // xmlhttp.send(data);
}

//选点结束响应事件
function updatePointEnd() {
    identifyConfig.showAddress = true;
    identifyConfig.showZ = true;
    identifyConfig.showRiverName = true;
    identifyConfig.showRiver = true;
    isModifying = false;//退出选点状态
    dojo.byId("submitPointEnd").disabled = true;
}

//向服务器传输选点的坐标
function conveyPointXY() {
    var jsonobject = { "ObjectID": SelectedObjectID, "X": X, "Y": Y };//json对象
    var data = JSON.stringify(jsonobject);//转码
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            alert(xmlhttp.readyState);
        }
    }
    xmlhttp.open("POST", local_host + "crowdsource/fix_point/", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");//传送json的头部设置
    xmlhttp.send("fix_point="+data);
}