# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('crowdsource', '0003_auto_20141221_0919'),
    ]

    operations = [
        migrations.AddField(
            model_name='point',
            name='object_id',
            field=models.IntegerField(default=-999),
            preserve_default=True,
        ),
    ]
