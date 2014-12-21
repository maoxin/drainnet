# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('crowdsource', '0002_auto_20141109_0105'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='point',
            name='point_latitude',
        ),
        migrations.RemoveField(
            model_name='point',
            name='point_longitude',
        ),
        migrations.RemoveField(
            model_name='point',
            name='pub_date',
        ),
        migrations.RemoveField(
            model_name='point',
            name='user_name',
        ),
    ]
