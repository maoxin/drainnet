# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('crowdsource', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='point',
            name='point_name',
            field=models.CharField(default='miss', max_length=200),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='point',
            name='pub_date',
            field=models.DateTimeField(default=datetime.datetime(2014, 11, 8, 17, 5, 46, 253142, tzinfo=utc), verbose_name=b'date published'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='point',
            name='user_name',
            field=models.CharField(default='miss', max_length=200),
            preserve_default=False,
        ),
    ]
