//开启选择点功能的相应函数
function updatePoint() {
    alert("请在地图上选择点！");
    SelectedObjectID = ObjectID;
    //设置infoWindow以下信息不显示
    identifyConfig.showAddress = false;
    identifyConfig.showZ = false;
    identifyConfig.showRiverName = false;
    identifyConfig.showDeleteRiver = false;
    isModifying = true;//进入选点状态
    control.infoWindow.hide();
}

//选点结束响应事件
function updatePointEnd() {
    identifyConfig.showAddress = true;
    identifyConfig.showZ = true;
    identifyConfig.showRiverName = true;
    identifyConfig.showDeleteRiver = true;
    isModifying = false;//退出选点状态
    control.infoWindow.hide();
}

//向服务器传输选点的坐标
function conveyPointXY() {
    var jsonobject = { "object_id": SelectedObjectID, "latitude": X, "longitude": Y };//json对象
    var data = JSON.stringify(jsonobject);//转码
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            alert("请选择下一点！点击“修改完成”结束操作");
        }
    }
    xmlhttp.open("POST", local_host + "crowdsource/fix_point/", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");//传送json的头部设置
    xmlhttp.send("fix_point="+data);
}