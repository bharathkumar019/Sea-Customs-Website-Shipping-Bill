from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from company.models import Company

class LoginSerializer(serializers.Serializer):

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):

        user = authenticate(
            username=data["username"],
            password=data["password"]
        )

        if user is None:
            raise serializers.ValidationError(
                "Invalid username or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "Your account is not active."
            )

        data["user"] = user
        return data

class UnitMakerRegisterSerializer(serializers.Serializer):

    company_code = serializers.CharField(max_length=20)

    full_name = serializers.CharField(max_length=150)

    username = serializers.CharField(max_length=150)

    email = serializers.EmailField()

    password = serializers.CharField(write_only=True)

    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):

        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError(
                {"password": "Passwords do not match."}
            )

        if User.objects.filter(username=data["username"]).exists():
            raise serializers.ValidationError(
                {"username": "Username already exists."}
            )

        if User.objects.filter(email=data["email"]).exists():
            raise serializers.ValidationError(
                {"email": "Email already exists."}
            )

        return data
    
    def create(self, validated_data):

        validated_data.pop("confirm_password")

        try:
            company = Company.objects.get(
                company_code=validated_data["company_code"],
                status="APPROVED"
            )

        except Company.DoesNotExist:
            raise serializers.ValidationError(
                {
                    "company_code":
                    "Invalid Company Code"
                }
            )

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )

        user.full_name = validated_data["full_name"]

        user.company = company

        user.role = "UNIT_MAKER"

        user.status = "PENDING"

        user.is_active = False

        user.save()

        return user