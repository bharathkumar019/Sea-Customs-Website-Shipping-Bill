from django.urls import path
from .views import (
    LoginAPIView,
    UnitMakerRegisterAPIView,
    PendingUnitMakerAPIView,
    UnitMakerApprovalAPIView,
)

urlpatterns = [
    path(
        "login/",
        LoginAPIView.as_view(),
        name="login",
    ),
    path(
        "register/maker/",
        UnitMakerRegisterAPIView.as_view(),
        name="register_maker",
    ),
    path(
        "unit-makers/pending/",
        PendingUnitMakerAPIView.as_view(),
        name="pending_unit_makers",
    ),
    path(
        "unit-maker/approval/<int:pk>/",
        UnitMakerApprovalAPIView.as_view(),
        name="unit_maker_approval",
    ),
]   