from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Prediction
from inference import predict


class PredictView(APIView):

    def get(self, request):
        return Response({
            "message": "Send a POST request with the required input fields."
        })

    def post(self, request):

        try:
            result = predict(request.data)

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {
                    "error": "Prediction failed",
                    "detail": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        Prediction.objects.create(
            inputs=request.data,
            prediction=result["prediction"],
            label=result["label"],
            probability=result["probability"]
        )

        return Response(result)


class PredictionHistoryView(APIView):

    def get(self, request):

        predictions = Prediction.objects.all()[:50]

        data = []

        for p in predictions:
            data.append({
                "id": p.id,
                "inputs": p.inputs,
                "prediction": p.prediction,
                "label": p.label,
                "probability": p.probability,
                "created_at": p.created_at
            })

        return Response(data)