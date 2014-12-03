# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Point',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('point_longitude', models.FloatField()),
                ('point_latitude', models.FloatField()),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
