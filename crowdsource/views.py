from django.shortcuts import render
from ipware.ip import get_ip
import requests

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
