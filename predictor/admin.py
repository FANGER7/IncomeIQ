from django.contrib import admin
from .models import Prediction


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "label",
        "probability",
        "created_at",
    )

    search_fields = (
        "label",
    )

    list_filter = (
        "label",
        "created_at",
    )

    ordering = (
        "-created_at",
    )