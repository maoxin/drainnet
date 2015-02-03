from django.db import models

class Point(models.Model):
    # point_longitude = models.FloatField()
    # point_latitude = models.FloatField()
    
    object_id = models.IntegerField(default=-999)
    point_name = models.CharField(max_length=200)
    # user_name = models.CharField(max_length=200)
    # pub_date = models.DateTimeField('date published')
    
class FixPoint(models.Model):
    object_id = models.IntegerField(default=-999)
    fix_latitude = models.FloatField(default=-999.0)
    fix_longitude = models.FloatField(default=-999.0)
    
class DeleteRiver(models.Model):
    object_id = models.IntegerField(default=-999)
    

