from django.conf.urls import patterns, url

from crowdsource import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
)