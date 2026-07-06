from django.db import models

class Prediction(models.Model):
    inputs = models.JSONField()
    prediction = models.IntegerField()
    label = models.CharField(max_length=20)
    probability = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.label} ({self.probability:.2f})"