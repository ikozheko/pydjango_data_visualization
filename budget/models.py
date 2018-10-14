from django.db import models
from django.urls import reverse

class Unit(models.Model):
    name = models.CharField(max_length=255)
    def __str__(self):
        return self.name
    def natural_key(self):
        return (self.id, self.name)

class Indicator(models.Model):
    name = models.CharField(max_length=255)
    kbk = models.CharField(max_length=100)
    def __str__(self):
        return self.kbk + ' - ' + self.name
    def natural_key(self):
        return (self.id, self.kbk, self.name)

class Execution(models.Model):
    year = models.IntegerField()
    purpose = models.FloatField()
    cash = models.FloatField()
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE)
    indicator = models.ForeignKey(Indicator, on_delete=models.CASCADE)
    def __str__(self):
        return str(self.year) + ': ' + self.indicator.name