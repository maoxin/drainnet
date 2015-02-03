# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('crowdsource', '0004_point_object_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='FixPoint',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('object_id', models.IntegerField(default=-999)),
                ('fix_latitude', models.FloatField(default=-999.0)),
                ('fix_longitude', models.FloatField(default=-999.0)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
