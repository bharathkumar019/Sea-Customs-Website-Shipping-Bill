from decimal import Decimal, InvalidOperation

from django.db import connection

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


# =========================================================
# FIXED TAX RATES
# =========================================================

EXPORT_DUTY_RATE = Decimal("5.00")
GST_RATE = Decimal("15.00")


# =========================================================
# HSN LOOKUP
# =========================================================


class HSNListView(APIView):

    """
    List HSN master records with search and filters.

    Uses the existing hsn_master table directly. No model or migration
    is required.
    """

    def get(self, request):
        search = str(request.query_params.get("q", "")).strip()
        product_category = str(request.query_params.get("product_category", "")).strip()
        unit = str(request.query_params.get("unit", "")).strip()
        risk_category = str(request.query_params.get("risk_category", "")).strip()

        boolean_filters = {}
        for field in ("exportable", "restricted", "prohibited", "hazardous"):
            value = request.query_params.get(field)
            if value in ("true", "false"):
                boolean_filters[field] = value == "true"

        where = []
        params = []

        if search:
            where.append("(hsn_code LIKE %s OR description LIKE %s OR product_category LIKE %s)")
            term = f"%{search}%"
            params.extend([term, term, term])

        if product_category:
            where.append("product_category = %s")
            params.append(product_category)

        if unit:
            where.append("unit = %s")
            params.append(unit)

        if risk_category:
            where.append("risk_category = %s")
            params.append(risk_category)

        for field, value in boolean_filters.items():
            where.append(f"{field} = %s")
            params.append(value)

        where_sql = f"WHERE {' AND '.join(where)}" if where else ""

        data_query = f"""
            SELECT
                hsn_code,
                description,
                product_category,
                unit,
                exportable,
                export_declaration,
                restricted,
                prohibited,
                hazardous,
                igst_rate,
                other_duty_rate,
                risk_category
            FROM hsn_master
            {where_sql}
            ORDER BY hsn_code ASC
        """

        options_query = """
            SELECT DISTINCT
                product_category,
                unit,
                risk_category
            FROM hsn_master
            ORDER BY product_category, unit, risk_category
        """

        try:
            with connection.cursor() as cursor:
                cursor.execute(data_query, params)
                rows = cursor.fetchall()

                cursor.execute(options_query)
                option_rows = cursor.fetchall()

        except Exception as exc:
            print("HSN LIST DATABASE ERROR:", exc)
            return Response(
                {
                    "error": "Unable to read HSN master list.",
                    "details": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        results = []

        for row in rows:
            (
                hsn_code,
                description,
                product_category,
                unit,
                exportable,
                export_declaration,
                restricted,
                prohibited,
                hazardous,
                igst_rate,
                other_duty_rate,
                risk_category,
            ) = row

            igst = Decimal(str(igst_rate or "0"))
            other_duty = Decimal(str(other_duty_rate or "0"))
            base_rate = EXPORT_DUTY_RATE + GST_RATE
            calculated_igst = base_rate * igst / Decimal("100")
            calculated_other_duty = base_rate * other_duty / Decimal("100")
            total_tax_duty = (
                EXPORT_DUTY_RATE
                + GST_RATE
                + calculated_igst
                + calculated_other_duty
            )

            results.append({
                "hsn_code": hsn_code,
                "description": description or "",
                "product_category": product_category or "",
                "unit": unit or "",
                "exportable": bool(exportable),
                "export_declaration": bool(export_declaration),
                "restricted": bool(restricted),
                "prohibited": bool(prohibited),
                "hazardous": bool(hazardous),
                "export_duty_rate": str(EXPORT_DUTY_RATE),
                "gst_rate": str(GST_RATE),
                "igst_rate": str(igst),
                "other_duty_rate": str(other_duty),
                "calculated_igst": str(calculated_igst.quantize(Decimal("0.01"))),
                "calculated_other_duty": str(calculated_other_duty.quantize(Decimal("0.01"))),
                "total_tax_duty": str(total_tax_duty.quantize(Decimal("0.01"))),
                "risk_category": risk_category or "",
            })

        return Response({
            "count": len(results),
            "results": results,
            "filter_options": {
                "product_categories": sorted({r[0] for r in option_rows if r[0]}),
                "units": sorted({r[1] for r in option_rows if r[1]}),
                "risk_categories": sorted({r[2] for r in option_rows if r[2]}),
            },
        }, status=status.HTTP_200_OK)


class HSNLookupView(APIView):

    """
    Read HSN data directly from the existing MySQL
    hsn_master table.

    No Django HSN model is used.
    """

    def get(self, request, hsn_code):

        # -------------------------------------------------
        # CLEAN HSN CODE
        # -------------------------------------------------

        hsn_code = str(hsn_code).strip()

        if not hsn_code:
            return Response(
                {
                    "error": "HSN code is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(hsn_code) > 20:
            return Response(
                {
                    "error": "Invalid HSN code."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        # -------------------------------------------------
        # QUERY MYSQL
        # -------------------------------------------------

        query = """
            SELECT
                hsn_code,
                description,
                product_category,
                unit,
                exportable,
                export_declaration,
                restricted,
                prohibited,
                hazardous,
                igst_rate,
                other_duty_rate,
                risk_category
            FROM hsn_master
            WHERE hsn_code = %s
            LIMIT 1
        """


        try:

            with connection.cursor() as cursor:

                cursor.execute(
                    query,
                    [hsn_code]
                )

                row = cursor.fetchone()

        except Exception as exc:

            print(
                "HSN DATABASE ERROR:",
                exc
            )

            return Response(
                {
                    "error": "Unable to read HSN data.",
                    "details": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


        # -------------------------------------------------
        # NOT FOUND
        # -------------------------------------------------

        if not row:

            return Response(
                {
                    "error":
                        f"HSN code {hsn_code} was not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )


        # -------------------------------------------------
        # READ DATABASE ROW
        # -------------------------------------------------

        (
            db_hsn_code,
            description,
            product_category,
            unit,
            exportable,
            export_declaration,
            restricted,
            prohibited,
            hazardous,
            igst_rate,
            other_duty_rate,
            risk_category,
        ) = row


        # -------------------------------------------------
        # CONVERT TAX VALUES
        # -------------------------------------------------

        try:

            igst_rate = Decimal(
                str(igst_rate or "0")
            )

            other_duty_rate = Decimal(
                str(other_duty_rate or "0")
            )

        except (
            InvalidOperation,
            ValueError,
            TypeError,
        ):

            return Response(
                {
                    "error":
                        "Invalid tax rate configured for this HSN."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


        # -------------------------------------------------
        # TAX CALCULATION
        # -------------------------------------------------

        base_rate = (
            EXPORT_DUTY_RATE +
            GST_RATE
        )


        calculated_igst = (
            base_rate *
            igst_rate /
            Decimal("100")
        )


        calculated_other_duty = (
            base_rate *
            other_duty_rate /
            Decimal("100")
        )


        total_tax_duty = (
            EXPORT_DUTY_RATE
            + GST_RATE
            + calculated_igst
            + calculated_other_duty
        )


        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        data = {

            "hsn_code": db_hsn_code,

            "description": (
                description or ""
            ),

            "product_category": (
                product_category or ""
            ),

            "unit": (
                unit or ""
            ),


            # Export rules

            "exportable": bool(
                exportable
            ),

            "export_declaration": bool(
                export_declaration
            ),

            "restricted": bool(
                restricted
            ),

            "prohibited": bool(
                prohibited
            ),

            "hazardous": bool(
                hazardous
            ),


            # Fixed rates

            "export_duty_rate": str(
                EXPORT_DUTY_RATE
            ),

            "gst_rate": str(
                GST_RATE
            ),


            # HSN-specific rates

            "igst_rate": str(
                igst_rate
            ),

            "other_duty_rate": str(
                other_duty_rate
            ),


            # Calculated rates

            "calculated_igst": str(
                calculated_igst.quantize(
                    Decimal("0.01")
                )
            ),

            "calculated_other_duty": str(
                calculated_other_duty.quantize(
                    Decimal("0.01")
                )
            ),

            "total_tax_duty": str(
                total_tax_duty.quantize(
                    Decimal("0.01")
                )
            ),


            # Risk

            "risk_category": (
                risk_category or ""
            ),
        }


        return Response(
            data,
            status=status.HTTP_200_OK
        )