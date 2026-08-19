from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from django.shortcuts import get_object_or_404

from .serializers import (
    LoginSerializer,
    UnitMakerRegisterSerializer,
)


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Login Successful",

                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),

                "user": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "email": user.email,

                    "role": user.role,
                    "status": user.status,

                    "company": (
                        user.company.company_name
                        if user.company else None
                    ),
                    "company_code": (
                        user.company.company_code
                        if user.company else None
                    ),

                    "zone": (
                        user.zone.zone_name
                        if user.zone else None
                    ),
                    "zone_code": (
                        user.zone.zone_code
                        if user.zone else None
                    ),

                    "region": (
                        user.region.region_name
                        if user.region else None
                    ),
                    "region_code": (
                        user.region.region_code
                        if user.region else None
                    ),
                }
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class UnitMakerRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        serializer = UnitMakerRegisterSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "message": (
                        "Registration Successful. "
                        "Waiting for Unit Approver Approval."
                    )
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class PendingUnitMakerAPIView(APIView):

    def get(self, request):

        users = User.objects.filter(
            role="UNIT_MAKER",
            status="PENDING"
        )

        data = []

        for user in users:
            data.append({
                "id": user.id,
                "full_name": user.full_name,
                "username": user.username,
                "email": user.email,
                "company": user.company.company_name,
                "company_code": user.company.company_code,
                "status": user.status,
            })

        return Response(data)


class UnitMakerApprovalAPIView(APIView):

    def post(self, request, pk):

        user = get_object_or_404(
            User,
            pk=pk,
            role="UNIT_MAKER"
        )

        action = request.data.get("action")

        if action == "approve":

            user.status = "APPROVED"
            user.is_active = True
            user.save()

            return Response({
                "message": "Unit Maker Approved Successfully"
            })

        elif action == "reject":

            user.status = "REJECTED"
            user.is_active = False
            user.save()

            return Response({
                "message": "Unit Maker Rejected"
            })

        return Response(
            {
                "message": "Invalid Action"
            },
            status=status.HTTP_400_BAD_REQUEST
        )