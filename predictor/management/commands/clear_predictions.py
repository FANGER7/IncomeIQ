from django.core.management.base import BaseCommand
from predictor.models import Prediction


class Command(BaseCommand):
    help = "Delete all prediction records"

    def handle(self, *args, **kwargs):
        count = Prediction.objects.count()
        Prediction.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully deleted {count} prediction(s)."
            )
        )