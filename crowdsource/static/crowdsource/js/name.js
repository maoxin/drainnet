﻿//提交河段名称的响应函数
function updateRiverName() {
    dojo.byId("name_update").disabled = true;
    dojo.byId("submitName").disabled = true;

    var jsonobject = { "river_name": dojo.byId("name_update").value ,
                       "object_id": ObjectID};//json对象
    var data = JSON.stringify(jsonobject);//转码
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            alert(xmlhttp.readyState);
        }
    }
    
    xmlhttp.open("POST", local_host + "crowdsource/river_name_input/", true);
    // xmlhttp.setRequestHeader("Content-type", "application/json");//传送json的头部设置
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8")
    // xmlhttp.send(data);
    xmlhttp.send("river_name="+data);
}

//删除河段
function deleteThisRiver() {
    alert(ObjectID);
    var jsonobject = { "object_id": ObjectID };//json对象
    var data = JSON.stringify(jsonobject);//转码
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            alert(xmlhttp.readyState);
        }
    }
    xmlhttp.open("POST", local_host + "crowdsource/delete_river/", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");//传送json的头部设置
    xmlhttp.send("delete_river=" + data);
}