function SOAPClientParameters() {
    var _pl = new Array();
    this.add = function (name, value) {
        _pl[name] = value;
        return this;
    }
    this.toXml = function () {
        var xml = "";
        for (var p in _pl) {
            if (typeof (_pl[p]) != "function")
                xml += "<" + p + ">" + _pl[p].toString().replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">") + "</" + p + ">";
        }
        return xml;
    }
}
function SOAPClient() { }
SOAPClient.invoke = function (url, method, parameters, async, callback) {
    if (async)
        SOAPClient._loadWsdl(url, method, parameters, async, callback);
    else
        return SOAPClient._loadWsdl(url, method, parameters, async, callback);
}
// private: wsdl cache
SOAPClient_cacheWsdl = new Array();
// private: invoke async
SOAPClient._loadWsdl = function (url, method, parameters, async, callback) {
    // load from cache?
    var wsdl = SOAPClient_cacheWsdl[url];
    if (wsdl + "" != "" && wsdl + "" != "undefined")
        return SOAPClient._sendSoapRequest(url, method, parameters, async, callback, wsdl);
    // get wsdl
    var xmlHttp = SOAPClient._getXmlHttp();
    xmlHttp.open("POST", url + "?wsdl", async);
    if (async) {
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4)
                SOAPClient._onLoadWsdl(url, method, parameters, async, callback, xmlHttp);
        }
    }
    xmlHttp.send(null);
    if (!async)
        return SOAPClient._onLoadWsdl(url, method, parameters, async, callback, xmlHttp);
}
SOAPClient._onLoadWsdl = function (url, method, parameters, async, callback, req) {
    var wsdl = req.responseXML;
    SOAPClient_cacheWsdl[url] = wsdl;	// save a copy in cache
    return SOAPClient._sendSoapRequest(url, method, parameters, async, callback, wsdl);
}
SOAPClient._sendSoapRequest = function (url, method, parameters, async, callback, wsdl) {
    // get namespace
    var ns = (wsdl.documentElement.attributes["targetNamespace"] + "" == "undefined") ? wsdl.documentElement.attributes.getNamedItem("targetNamespace").nodeValue : wsdl.documentElement.attributes["targetNamespace"].value;
    // build SOAP request
    var sr =
                "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
                "<soap:Envelope " +
                "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance/\" " +
        "xmlns:xsd=\"http://www.w3.org/2001/XMLSchema/\" " +
        "xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
        "<soap:Body>" +
        "<" + method + " xmlns=\"" + ns + "\">" +
        parameters.toXml() +
        "</" + method + "></soap:Body></soap:Envelope>";
    // send request
    var xmlHttp = SOAPClient._getXmlHttp();
    xmlHttp.open("POST", url, async);
    var soapaction = ((ns.lastIndexOf("/") != ns.length - 1) ? ns + "/" : ns) + method;
    xmlHttp.setRequestHeader("SOAPAction", soapaction);
    xmlHttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
    if (async) {
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4)
                SOAPClient._onSendSoapRequest(method, async, callback, wsdl, xmlHttp);
        }
    }
    xmlHttp.send(sr);
    if (!async)
        return SOAPClient._onSendSoapRequest(method, async, callback, wsdl, xmlHttp);
}
SOAPClient._onSendSoapRequest = function (method, async, callback, wsdl, req) {
    var o = null;
    var nd = SOAPClient._getElementsByTagName(req.responseXML, method + "Response");
    if (0 == nd.length) {
        nd = SOAPClient._getElementsByTagName(req.responseXML, method + "Result");
    }
    if (nd.length == 0) {
        if (req.responseXML.getElementsByTagName("faultcode").length > 0)
            throw new Error(500, req.responseXML.getElementsByTagName("faultstring")[0].childNodes[0].nodeValue);
    }
    else
        o = SOAPClient._soapresult2object(nd[0], wsdl);
    if (callback)
        if (document.all) callback(o, req.responseText);
        else callback(o, req.responseXML);
    if (!async)
        return o;
}
// private: utils
SOAPClient._getElementsByTagName = function (document, tagName) {
    try {
        if (document.all) {
            // trying to get node omitting any namespaces (latest versions of MSXML.XMLDocument)
            return document.selectNodes(".//*[local-name()=\"" + tagName + "\"]");
        } else {
            return document.evaluate(".//*[local-name()=\"" + tagName + "\"]", document, null, XPathResult.ANY_TYPE, null);
        }
    }
    catch (ex) { }
    // old XML parser support
    return document.getElementsByTagName(tagName);
}
SOAPClient._soapresult2object = function (node, wsdl) {
    return SOAPClient._node2object(node, wsdl);
}
SOAPClient._node2object = function (node, wsdl) {
    // null node
    if (node == null)
        return null;
    // text node
    if (node.nodeType == 3 || node.nodeType == 4)
        return SOAPClient._extractValue(node, wsdl);
    // leaf node
    if (node.childNodes.length == 1 && (node.childNodes[0].nodeType == 3 || node.childNodes[0].nodeType == 4))
        return SOAPClient._node2object(node.childNodes[0], wsdl);
    var isarray = SOAPClient._getTypeFromWsdl(node.nodeName, wsdl).toLowerCase().indexOf("arrayof") != -1;
    // object node
    if (!isarray) {
        var obj = null;
        if (node.hasChildNodes())
            obj = new Object();
        for (var i = 0; i < node.childNodes.length; i++) {
            var p = SOAPClient._node2object(node.childNodes[i], wsdl);
            obj[node.childNodes[i].nodeName] = p;
        }
        return obj;
    }
        // list node
    else {
        // create node ref
        var l = new Array();
        for (var i = 0; i < node.childNodes.length; i++)
            l[l.length] = SOAPClient._node2object(node.childNodes[i], wsdl);
        return l;
    }
    return null;
}
SOAPClient._extractValue = function (node, wsdl) {
    var value = node.nodeValue;
    switch (SOAPClient._getTypeFromWsdl(node.parentNode.nodeName, wsdl).toLowerCase()) {
        default:
        case "s:string":
            return (value != null) ? value + "" : "";
        case "s:boolean":
            return value + "" == "true";
        case "s:int":
        case "s:long":
            return (value != null) ? parseInt(value + "", 10) : 0;
        case "s:double":
            return (value != null) ? parseFloat(value + "") : 0;
        case "s:datetime":
            if (value == null)
                return null;
            else {
                value = value + "";
                value = value.substring(0, value.lastIndexOf("."));
                value = value.replace(/T/gi, " ");
                value = value.replace(/-/gi, "/");
                var d = new Date();
                d.setTime(Date.parse(value));
                return d;
            }
    }
}
SOAPClient._getTypeFromWsdl = function (elementname, wsdl) {
    var ell = wsdl.getElementsByTagName("s:element");	// IE
    if (ell.length == 0)
        ell = wsdl.getElementsByTagName("element");	// MOZ
    for (var i = 0; i < ell.length; i++) {
        if (ell[i].attributes["name"] + "" == "undefined")	// IE
        {
            if (ell[i].attributes.getNamedItem("name") != null && ell[i].attributes.getNamedItem("name").nodeValue == elementname && ell[i].attributes.getNamedItem("type") != null)
                return ell[i].attributes.getNamedItem("type").nodeValue;
        }
        else // MOZ
        {
            if (ell[i].attributes["name"] != null && ell[i].attributes["name"].value == elementname && ell[i].attributes["type"] != null)
                return ell[i].attributes["type"].value;
        }
    }
    return "";
}
// private: xmlhttp factory
SOAPClient._getXmlHttp = function () {
    try {
        if (window.XMLHttpRequest) {
            var req = new XMLHttpRequest();
            // some versions of Moz do not support the readyState property and the onreadystate event so we patch it!
            if (req.readyState == null) {
                req.readyState = 1;
                req.addEventListener("load",
                                    function () {
                                        req.readyState = 4;
                                        if (typeof req.onreadystatechange == "function")
                                            req.onreadystatechange();
                                    },
                                    false);
            }
            return req;
        }
        if (window.ActiveXObject)
            return new ActiveXObject(SOAPClient._getXmlHttpProgID());
    }
    catch (ex) { }
    throw new Error("Your browser does not support XmlHttp objects");
}
SOAPClient._getXmlHttpProgID = function () {
    if (SOAPClient._getXmlHttpProgID.progid)
        return SOAPClient._getXmlHttpProgID.progid;
    var progids = ["Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
    var o;
    for (var i = 0; i < progids.length; i++) {
        try {
            o = new ActiveXObject(progids[i]);
            return SOAPClient._getXmlHttpProgID.progid = progids[i];
        }
        catch (ex) { };
    }
    throw new Error("Could not find an installed XML parser");
}
/* 以下为添加方法  */
SOAPClient.getSingleValue = function (repXML, name) {
    if (document.all) {
        var xmldom = new ActiveXObject("Microsoft.XMLDOM");
        xmldom.async = false;
        xmldom.loadXML(repXML);
        return xmldom.getElementsByTagName(name)[0].text;
    } else {
        return repXML.getElementsByTagName(name)[0].textContent;
    }
}