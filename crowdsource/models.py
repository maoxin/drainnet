from django.db import models

class Point(models.Model):
    # point_longitude = models.FloatField()
    # point_latitude = models.FloatField()
    
    point_name = models.CharField(max_length=200)
    # user_name = models.CharField(max_length=200)
    # pub_date = models.DateTimeField('date published')

