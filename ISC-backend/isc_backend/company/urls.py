from django.urls import path
from .views import (
    UnitApproverRegisterAPIView,
    UnitMakerRegisterAPIView,
    CheckRegistrationStatusAPIView,
    PendingCompanyListAPIView,
    CompanyApprovalAPIView,
    PendingUnitMakerListAPIView,
    UnitMakerApprovalAPIView,
)
urlpatterns = [

    path(
        "register/approver/",
        UnitApproverRegisterAPIView.as_view(),
        name="register_approver",
    ),

    path(
        "register/maker/",
        UnitMakerRegisterAPIView.as_view(),
        name="register_maker",
    ),

    path(
        "registration/status/",
        CheckRegistrationStatusAPIView.as_view(),
        name="registration_status",
    ),

    path(
        "companies/pending/",
        PendingCompanyListAPIView.as_view(),
        name="pending_companies",
    ),

    path(
        "company/approval/<int:pk>/",
        CompanyApprovalAPIView.as_view(),
        name="company_approval",
    ),
    path(
        "unit-makers/pending/",
        PendingUnitMakerListAPIView.as_view(),
    ),

    path(
        "unit-maker/approval/<int:pk>/",
        UnitMakerApprovalAPIView.as_view(),
    ),
]