from django.db import models


class Prediction(models.Model):
    inputs = models.JSONField()
    prediction = models.IntegerField()
    label = models.CharField(max_length=10)
    probability = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.label} ({self.probability})"