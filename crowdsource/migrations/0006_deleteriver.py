# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('crowdsource', '0005_fixpoint'),
    ]

    operations = [
        migrations.CreateModel(
            name='DeleteRiver',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('object_id', models.IntegerField(default=-999)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
