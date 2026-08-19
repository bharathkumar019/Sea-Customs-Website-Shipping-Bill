from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PendingUnitMakerSerializer
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Company
from .serializers import (
    UnitApproverRegisterSerializer,
    UnitMakerRegisterSerializer,
    CompanySerializer,
)

from django.shortcuts import get_object_or_404
from authentication.models import User

class UnitApproverRegisterAPIView(APIView):

    def post(self, request):

        serializer = UnitApproverRegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": "Registration Successful. Waiting for DC Approval."
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CheckRegistrationStatusAPIView(APIView):

    def post(self, request):

        username = request.data.get("username")

        user = User.objects.filter(username=username).first()

        if not user:
            return Response(
                {"message": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "status": user.status,
            "is_active": user.is_active,
        })
        
class PendingCompanyListAPIView(ListAPIView):

    serializer_class = CompanySerializer

    def get_queryset(self):
        return Company.objects.filter(status="PENDING")

class CompanyApprovalAPIView(APIView):
    

    def post(self, request, pk):

        company = get_object_or_404(Company, pk=pk)

        action = request.data.get("action")

        if action == "approve":

            company.status = "APPROVED"

            company.company_code = f"{company.zone.zone_code}-CMP-{company.id:03d}"

            company.save()

            user = User.objects.get(
                company=company,
                role="UNIT_APPROVER"
            )

            user.status = "APPROVED"
            user.is_active = True
            user.save()

            return Response(
                {
                    "message": "Company Approved Successfully"
                }
            )

        elif action == "reject":

            company.status = "REJECTED"
            company.save()

            user = User.objects.get(
                company=company,
                role="UNIT_APPROVER"
            )

            user.status = "REJECTED"
            user.is_active = False
            user.save()

            return Response(
                {
                    "message": "Company Rejected Successfully"
                }
            )

        return Response(
            {
                "message": "Invalid Action"
            },
            status=400
        )
        
class PendingUnitMakerListAPIView(ListAPIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    serializer_class = PendingUnitMakerSerializer

    def get_queryset(self):

        company = self.request.user.company

        return User.objects.filter(
            company=company,
            role="UNIT_MAKER",
            status="PENDING",
        )
        
class UnitMakerRegisterAPIView(APIView):

    def post(self, request):

        serializer = UnitMakerRegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": "Registration Successful. Waiting for Unit Approver Approval."
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UnitMakerApprovalAPIView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        
        maker = get_object_or_404(
            User,
            pk=pk,
            role="UNIT_MAKER",
            company=request.user.company,
        )

        action = request.data.get("action")

        if action == "approve":

            maker.status = "APPROVED"
            maker.is_active = True
            maker.save()

            return Response({
                "message": "Unit Maker Approved Successfully"
            })

        elif action == "reject":

            maker.status = "REJECTED"
            maker.is_active = False
            maker.save()

            return Response({
                "message": "Unit Maker Rejected Successfully"
            })

        return Response(
            {
                "message": "Invalid Action"
            },
            status=400,
        )
        
      
      
      
        
