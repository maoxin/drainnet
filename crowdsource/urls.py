from django.conf.urls import patterns, url

from crowdsource import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^river_name_input/$', views.river_name_input, name='river_name_input'),
    url(r'^fix_point/$', views.fix_point, name='fix_point')
)