from django.urls import path

from .views import (
    ShippingBillListCreateView,
    ShippingBillDetailView,
    SubmitShippingBillView,
    ApproverShippingBillActionView,
    ResubmitShippingBillView,
    DCLetExportView,
    DCRaiseQueryView,
    ApproverQueryResponseView,
    ApproverForwardQueryView,
    ApproverRaiseMakerQueryView,
    MakerQueryResponseView,
    ACShipmentActionView,
)

from .edit_views import (
    EditableShippingBillView,
)

from .edit_document_views import (
    EditableShippingBillDocumentView,
)

from .hsn_views import (
    HSNLookupView,
    HSNListView,
)

from .print_views import (
    ShippingBillPrintListView,
    ShippingBillPrintDetailView,
)

from .document_views import (
    ShippingBillDocumentListCreateView,
    ShippingBillDocumentDetailView,
    VerifyShippingBillDocumentView,
)


urlpatterns = [
    
    # =====================================================
    # RESTRICTED MAKER EDIT SCREEN
    # =====================================================

    path(
        "shipping-bills/<int:pk>/editable/",
        EditableShippingBillView.as_view(),
        name="shipping-bill-editable",
    ),

    path(
        "shipping-bills/<int:pk>/editable-documents/",
        EditableShippingBillDocumentView.as_view(),
        name="shipping-bill-editable-documents",
    ),

    # =====================================================
    # SHIPPING BILL
    # =====================================================

    path(
        "shipping-bills/",
        ShippingBillListCreateView.as_view(),
        name="shipping-bill-list-create"
    ),

    path(
        "shipping-bills/<int:pk>/",
        ShippingBillDetailView.as_view(),
        name="shipping-bill-detail"
    ),

    path(
        "shipping-bills/<int:pk>/submit/",
        SubmitShippingBillView.as_view(),
        name="shipping-bill-submit"
    ),

    path(
        "shipping-bills/<int:pk>/approver-action/<str:action>/",
        ApproverShippingBillActionView.as_view(),
        name="shipping-bill-approver-action"
    ),

    path(
        "shipping-bills/<int:pk>/resubmit/",
        ResubmitShippingBillView.as_view(),
        name="shipping-bill-resubmit"
    ),

    path(
        "shipping-bills/<int:pk>/let-export/",
        DCLetExportView.as_view(),
        name="shipping-bill-let-export"
    ),

    path(
        "shipping-bills/<int:pk>/ac-action/<str:action>/",
        ACShipmentActionView.as_view(),
        name="shipping-bill-ac-action",
    ),
    
    path(
        "shipping-bills/<int:pk>/raise-query/",
        DCRaiseQueryView.as_view(),
        name="shipping-bill-raise-query"
    ),

    path(
        "shipping-bills/<int:pk>/approver-query-response/",
        ApproverQueryResponseView.as_view(),
        name="approver-query-response"
    ),

    path(
        "shipping-bills/<int:pk>/forward-query/",
        ApproverForwardQueryView.as_view(),
        name="approver-forward-query"
    ),

    path(
        "shipping-bills/<int:pk>/approver-raise-maker-query/",
        ApproverRaiseMakerQueryView.as_view(),
        name="approver-raise-maker-query"
    ),

    path(
        "shipping-bills/<int:pk>/maker-query-response/",
        MakerQueryResponseView.as_view(),
        name="maker-query-response"
    ),


    # =====================================================
    # PRINT SHIPPING BILL (READ ONLY)
    # =====================================================

    path(
        "shipping-bills/print-list/",
        ShippingBillPrintListView.as_view(),
        name="shipping-bill-print-list",
    ),

    path(
        "shipping-bills/<int:pk>/print/",
        ShippingBillPrintDetailView.as_view(),
        name="shipping-bill-print",
    ),


    # =====================================================
    # SHIPPING BILL DOCUMENTS
    # =====================================================

    # GET  → list documents
    # POST → upload document
    #
    # Example:
    # /api/shipping-bills/5/documents/

    path(
        "shipping-bills/<int:pk>/documents/",
        ShippingBillDocumentListCreateView.as_view(),
        name="shipping-bill-document-list-create"
    ),

    # GET    → view one document
    # DELETE → delete document
    #
    # Example:
    # /api/shipping-bills/5/documents/10/

    path(
        "shipping-bills/<int:pk>/documents/<int:document_id>/",
        ShippingBillDocumentDetailView.as_view(),
        name="shipping-bill-document-detail"
    ),

    # POST → Unit Approver verifies document
    #
    # Example:
    # /api/shipping-bills/5/documents/10/verify/

    path(
        "shipping-bills/<int:pk>/documents/<int:document_id>/verify/",
        VerifyShippingBillDocumentView.as_view(),
        name="shipping-bill-document-verify"
    ),


    # =====================================================
    path(
        "hsn/",
        HSNListView.as_view(),
        name="hsn-list",
    ),

    # HSN
    # =====================================================

    path(
        "hsn/<str:hsn_code>/",
        HSNLookupView.as_view(),
        name="hsn-lookup"
    ),

]