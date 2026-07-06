from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from inference import predict
from .models import Prediction


class PredictAPIView(APIView):

    def post(self, request):

        result = predict(request.data)

        Prediction.objects.create(
            inputs=request.data,
            prediction=result["prediction"],
            label=result["label"],
            probability=result["probability"]
        )

        return Response(result, status=status.HTTP_200_OK)