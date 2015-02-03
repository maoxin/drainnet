# _*_coding:utf-8_*_

from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from ipware.ip import get_ip
from models import Point, FixPoint, DeleteRiver
import requests
import json

@ensure_csrf_cookie
def index(request):
    ip = get_ip(request)
    print ip
    # geo = GeoIP()
    ip2location = requests.get('http://ipinfo.io/%s/json/' %ip).json()
    latitude, longitude = eval(ip2location['loc'])
    # need more constraint to avoid wrong ip, which causes 'loc': u''
    context = {
        'latitude': float(latitude),
        'longitude': float(longitude),
    }
    
    return render(request, 'crowdsource/index.html', context)

@csrf_exempt
def river_name_input(request):
    print get_ip(request)
    print request.POST
    river_info = json.loads(request.POST['river_name'])
    river_name = river_info['river_name']
    object_id = river_info['object_id']
    print river_name
    print object_id
    # latitude = request.POST['latitude']
    # longitude = request.POST['longitude']
    # river_id = request.POST['river_id']
    
    # print 'river name:', river_name
    # print 'latitude:', latitude
    # print 'longitude:', longitude
    
    # context = {
        # 'river_name': 'yr',
        # 'latitude': latitude,
        # 'longitude': longitude,
    # }
    
    P = Point(point_name=river_name, object_id=object_id)
    P.save()
    
    # return render(request, 'crowdsource/river_name_response.html', context)
    return HttpResponse(status=200)
    
@csrf_exempt
def fix_point(request):
    print get_ip(request)
    print request.POST
    fix_point = json.loads(request.POST['fix_point'])
    for i in fix_point:
        print i
        print fix_point[i]
        
    object_id = fix_point['object_id']
    latitude = fix_point['latitude']
    longitude = fix_point['longitude']
    
    FP = FixPoint(object_id=object_id, fix_latitude=latitude, fix_longitude=longitude)
    FP.save()
    
    # context = {
        # 'ObjectID': ObjectID,
        # 'X': X,
        # 'Y': Y,
    # }
    
    # return render(request, 'crowdsource/fix_point_response.html', context)
    return HttpResponse(status=200)
    
@csrf_exempt
def delete_river(request):
    print get_ip(request)
    print request.POST
    dl_river = json.loads(request.POST['delete_river'])
    for i in dl_river:
        print i
        print dl_river[i]
        
    object_id = dl_river['object_id']
    DR = DeleteRiver(object_id=object_id)
    DR.save()
    
    return HttpResponse(status=200)
    
    