from django.contrib import admin
from .models import Unit, Indicator, Execution

admin.site.register(Unit)
admin.site.register(Indicator)
admin.site.register(Execution)