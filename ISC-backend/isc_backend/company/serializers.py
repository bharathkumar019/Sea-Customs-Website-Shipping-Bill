from rest_framework import serializers
from .models import Zone, Company
from authentication.models import User


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = "__all__"

class CompanySerializer(serializers.ModelSerializer):

    zone_name = serializers.CharField(
        source="zone.zone_name",
        read_only=True,
    )

    approver_name = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = (
            "id",
            "company_name",
            "company_code",
            "iec_code",
            "gstin",
            "address",
            "status",
            "zone",
            "zone_name",
            "approver_name",
        )

    def get_approver_name(self, obj):

        approver = User.objects.filter(
            company=obj,
            role="UNIT_APPROVER",
        ).first()

        if approver:
            return approver.full_name

        return ""

class PendingUnitMakerSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "username",
            "email",
            "status",
        )

class UnitApproverRegisterSerializer(serializers.Serializer):

    company_name = serializers.CharField(max_length=200)
    iec_code = serializers.CharField(max_length=20)
    gstin = serializers.CharField(max_length=15)
    zone = serializers.PrimaryKeyRelatedField(
    queryset=Zone.objects.all()
    )
    address = serializers.CharField()

    approver_name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()

    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):

        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError(
                {"password": "Passwords do not match."}
            )

        if Company.objects.filter(iec_code=data["iec_code"]).exists():
            raise serializers.ValidationError(
                {"iec_code": "IEC Code already exists."}
            )

        if Company.objects.filter(gstin=data["gstin"]).exists():
            raise serializers.ValidationError(
                {"gstin": "GSTIN already exists."}
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

        zone = validated_data.pop("zone")

        company = Company.objects.create(
            company_name=validated_data["company_name"],
            iec_code=validated_data["iec_code"],
            gstin=validated_data["gstin"],
            zone=zone,
            address=validated_data["address"],
            status="PENDING"
        )

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )

        user.full_name = validated_data["approver_name"]
        user.company = company
        user.role = "UNIT_APPROVER"
        user.status = "PENDING"
        user.is_active = False
        user.save()

        return user
    
class UnitMakerRegisterSerializer(serializers.Serializer):
    company_code = serializers.CharField()
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

        company = Company.objects.filter(
            company_code=data["company_code"],
            status="APPROVED"
        ).first()

        if not company:
            raise serializers.ValidationError(
                {"company_code": "Invalid Company Code"}
            )

        if User.objects.filter(username=data["username"]).exists():
            raise serializers.ValidationError(
                {"username": "Username already exists."}
            )

        if User.objects.filter(email=data["email"]).exists():
            raise serializers.ValidationError(
                {"email": "Email already exists."}
            )

        data["company"] = company

        return data

    def create(self, validated_data):

        validated_data.pop("confirm_password")

        company = validated_data.pop("company")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )

        user.full_name = validated_data["full_name"]
        user.company = company
        user.role = "UNIT_MAKER"
        user.status = "PENDING"
        user.is_active = False
        user.save()

        return user