# Sea Customs Website – Shipping Bill Management System

A full-stack web application for managing the **Sea Customs Shipping Bill workflow**, including Shipping Bill creation, document management, verification, queries, approvals, HSN lookup, PDF/document preview, and role-based workflow management.

The system is designed with separate frontend and backend applications and supports multiple customs and business roles such as **Unit Maker, Unit Approver, DC Customs, and AC Customs**.

---

## 📌 Project Overview

The **Sea Customs Website – Shipping Bill Management System** provides a digital workflow for processing Shipping Bills from creation and document submission through verification, query handling, approval, and final customs processing.

The application manages:

* Shipping Bill details
* Multiple invoices
* Shipping Bill items
* HSN codes and tax information
* Bill of Lading details
* Supporting documents
* Document verification
* PDF/document preview
* Maker queries and responses
* Approver queries and responses
* DC queries
* AC approval actions
* Shipping Bill printing
* Company, region, and zone information
* Role-based authentication and authorization

---

# 🏗️ System Architecture

```text
                    Sea Customs Portal
                           │
             ┌─────────────┴─────────────┐
             │                           │
        React Frontend             Django Backend
             │                           │
        React + Vite             Django REST API
             │                           │
             └─────────────┬─────────────┘
                           │
                         MySQL
                           │
                  Shipping Bill Data
```

---

# 🛠️ Technology Stack

## Frontend

* React 19
* Vite
* JavaScript / JSX
* React Router
* Axios
* Tailwind CSS
* Lucide React
* Flaticon UI Icons

## Backend

* Python
* Django 6.0.8
* Django REST Framework
* Simple JWT Authentication
* Django CORS Headers

## Database

* MySQL

## Development Tools

* Git
* GitHub
* VS Code
* Postman

---

# 📂 Project Structure

```text
Sea Customs Portal/
│
├── ISC-backend/
│   │
│   └── isc_backend/
│       │
│       ├── authentication/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── migrations/
│       │
│       ├── company/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── migrations/
│       │
│       ├── shipping/
│       │
│       ├── shipping_bill/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── edit_views.py
│       │   ├── edit_serializers.py
│       │   ├── document_views.py
│       │   ├── edit_document_views.py
│       │   ├── hsn_views.py
│       │   ├── print_views.py
│       │   ├── urls.py
│       │   └── migrations/
│       │
│       ├── reports/
│       │
│       ├── shipping_bill_documents/
│       │
│       ├── isc_backend/
│       │   ├── settings.py
│       │   ├── urls.py
│       │   ├── asgi.py
│       │   └── wsgi.py
│       │
│       └── manage.py
│
├── ISC-frontend/
│   │
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── SQL.sql
├── hsn_code.sql
└── README.md
```

---

# 👥 User Roles

The backend defines four primary roles:

| Role              | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| **Unit Maker**    | Creates, edits and submits Shipping Bills                      |
| **Unit Approver** | Reviews Shipping Bills, verifies documents and handles queries |
| **DC Customs**    | Reviews Shipping Bills and performs DC-level actions           |
| **AC Customs**    | Performs AC-level review and approval actions                  |

---

# 🔄 Shipping Bill Workflow

The application supports a multi-stage Shipping Bill workflow.

```text
Unit Maker
    │
    ▼
Create Shipping Bill
    │
    ▼
Add Shipping Bill Details
    │
    ├── Add Invoices
    │
    ├── Add Items
    │
    ├── HSN Details
    │
    └── Upload Documents
    │
    ▼
Submit Shipping Bill
    │
    ▼
Unit Approver
    │
    ├── Review
    │
    ├── Verify Documents
    │
    └── Raise Query
    │
    ▼
Maker Query Response
    │
    ▼
Approver Re-verification
    │
    ▼
DC Customs
    │
    ├── Review
    │
    ├── Raise Query
    │
    └── LET Export
    │
    ▼
AC Customs
    │
    └── Final Shipment Action
```

---

# 📦 Main Features

## 1. Authentication

The system provides authentication using:

* Custom Django User model
* JWT authentication
* Role-based access
* User status management
* Company assignment
* Zone assignment
* Region assignment

User roles include:

```text
UNIT_MAKER
UNIT_APPROVER
DC_CUSTOMS
AC_CUSTOMS
```

---

# 🧾 2. Shipping Bill Management

Users can manage Shipping Bills containing information such as:

* Shipping Bill Number
* Request ID
* Exporter details
* Consignee details
* Buyer details
* Destination information
* Port of Loading
* Port of Discharge
* Mode of Transport
* Bill of Lading
* Vessel information
* Voyage information
* Container information
* Seal information
* Invoice information
* Customs assessment details
* EGM details
* Proof of Export details
* Shipping status

Each Shipping Bill receives a unique request ID.

Example:

```text
SBREQ-20260819-A1B2C3D4
```

---

# 🧾 3. Multiple Invoice Management

A Shipping Bill can contain multiple invoices.

Each invoice supports:

* Invoice Number
* Invoice Date
* Currency
* Exchange Rate
* Freight
* Insurance
* Other Charges
* Total Invoice Value

Invoice numbers are maintained uniquely within a Shipping Bill.

---

# 📦 4. Shipping Bill Items

Each Shipping Bill can contain multiple items.

Item information includes:

* RITC / HSN Code
* Description
* Unit of Measurement
* Quantity
* Unit Price
* Total Value
* Export Duty Rate
* GST Rate
* IGST Rate
* Other Duty Rate
* Calculated IGST
* Calculated Other Duty
* Total Tax/Duty Rate
* Risk Category

---

# 🔎 5. HSN Code Lookup

The system provides HSN lookup functionality.

Users can:

* Search HSN/RITC codes
* Retrieve HSN information
* View HSN master data
* Use HSN information while preparing Shipping Bills

The project includes:

```text
hsn_code.sql
```

for HSN master data.

---

# 📄 6. Document Management

Shipping Bills can have supporting documents.

Supported document categories include:

* Invoice Package
* Bill of Lading Document
* Packing List Document

Documents can be:

* Uploaded
* Viewed
* Previewed
* Deleted where permitted
* Verified by the Unit Approver

Document verification records include:

* Verification status
* Verification date
* Verifying user

---

# 🔍 7. Document Preview

The frontend includes a reusable document viewer:

```text
src/components/DocumentViewer.jsx
```

This is used to display uploaded documents and PDF content through the application.

The backend serves uploaded documents through the configured media URL.

---

# ❓ 8. Query Management

The system supports queries between different workflow roles.

Supported operations include:

### DC Query

```text
DC → Approver
```

### Approver Query

```text
Approver → Maker
```

### Maker Response

```text
Maker → Approver
```

### Approver Response

```text
Approver → DC
```

This allows Shipping Bills to move back through the workflow when corrections or additional information are required.

---

# ✅ 9. Document Verification

Unit Approvers can verify uploaded Shipping Bill documents.

Example workflow:

```text
Maker Uploads Document
        ↓
Approver Reviews Document
        ↓
Approver Verifies Document
        ↓
Verification Recorded
```

---

# 🖨️ 10. Shipping Bill Printing

The application provides Shipping Bill print and preview functionality.

Frontend pages include:

```text
ShippingBillPrint.jsx
ShippingBillPrintPreview.jsx
```

Backend functionality is provided through:

```text
print_views.py
```

---

# 🏢 11. Company Management

Companies contain:

* Company Name
* IEC Code
* GSTIN
* Company Code
* Address
* Zone
* Status

Company status can be:

```text
PENDING
APPROVED
REJECTED
```

---

# 🌍 12. Region and Zone Management

The system supports regional and zone-based organization.

Example regions include:

```text
TN-N – Tamil Nadu North
TN-S – Tamil Nadu South
TN-E – Tamil Nadu East
TN-W – Tamil Nadu West
```

Zones can be associated with regions and companies.

---

# 🔌 API Structure

The Django backend exposes REST APIs under:

```text
/api/
```

Main API areas include:

```text
/api/authentication/
/api/company/
/api/shipping-bills/
/api/hsn/
```

Shipping Bill API examples:

```text
GET     /api/shipping-bills/
POST    /api/shipping-bills/

GET     /api/shipping-bills/<id>/

POST    /api/shipping-bills/<id>/submit/

POST    /api/shipping-bills/<id>/resubmit/

POST    /api/shipping-bills/<id>/approver-action/<action>/

POST    /api/shipping-bills/<id>/let-export/

POST    /api/shipping-bills/<id>/ac-action/<action>/
```

Document APIs include:

```text
GET     /api/shipping-bills/<id>/documents/

POST    /api/shipping-bills/<id>/documents/

GET     /api/shipping-bills/<id>/documents/<document_id>/

DELETE  /api/shipping-bills/<id>/documents/<document_id>/

POST    /api/shipping-bills/<id>/documents/<document_id>/verify/
```

---

# ⚙️ Backend Installation

## 1. Navigate to Backend

```bash
cd ISC-backend/isc_backend
```

## 2. Create Virtual Environment

```bash
python -m venv env
```

### Windows

```bash
env\Scripts\activate
```

### Linux / macOS

```bash
source env/bin/activate
```

---

# 📥 3. Install Dependencies

Install the required Django packages:

```bash
pip install django
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install mysqlclient
```

---

# 🗄️ 4. Configure MySQL

Create a MySQL database:

```sql
CREATE DATABASE ISC_database;
```

Update the database configuration in:

```text
ISC-backend/isc_backend/isc_backend/settings.py
```

Configure:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "ISC_database",
        "USER": "root",
        "PASSWORD": "YOUR_DATABASE_PASSWORD",
        "HOST": "localhost",
        "PORT": 3306,
    }
}
```

---

# 🔄 5. Run Migrations

From the directory containing `manage.py`:

```bash
python manage.py migrate
```

---

# ▶️ 6. Start Backend

```bash
python manage.py runserver
```

Backend:

```text
http://127.0.0.1:8000/
```

---

# 🎨 Frontend Installation

Open another terminal.

Navigate to:

```bash
cd ISC-frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173/
```

---

# 🔗 Frontend → Backend

The frontend communicates with the Django REST API using **Axios**.

API configuration is located in:

```text
ISC-frontend/src/api/axios.js
```

Service modules are located in:

```text
ISC-frontend/src/services/
```

Examples:

```text
authService.js
companyService.js
dcService.js
dcShippingBillService.js
hsnService.js
makerService.js
shippingBillDocumentService.js
shippingBillService.js
statusService.js
approverService.js
```

---

# 🖥️ Frontend Pages

The React application contains dedicated pages for different workflows.

### Authentication

```text
Login
Register
Join As Maker
```

### Maker

```text
Maker Dashboard
Maker Inbox
Create Shipping Bill
Shipping Bill Details
Shipping Bill Inbox
Shipping Bill Print
```

### Approver

```text
Approver Dashboard
Approver Inbox
Approver Review
Unit Maker Requests
```

### DC Customs

```text
DC Dashboard
DC Shipping Bill Inbox
DC Shipping Bill Details
DC Unit Approver Requests
```

### AC Customs

```text
AC Dashboard
```

### Other

```text
Landing
Check Status
HSN Master
```

---

# 📊 Backend Applications

The Django backend is divided into multiple applications:

| Application      | Purpose                               |
| ---------------- | ------------------------------------- |
| `authentication` | User authentication, roles and status |
| `company`        | Companies, regions and zones          |
| `shipping`       | Shipping-related module               |
| `shipping_bill`  | Shipping Bill management and workflow |
| `reports`        | Reporting functionality               |

---

# 📁 Database / SQL Files

The project contains:

```text
SQL.sql
hsn_code.sql
```

`SQL.sql` contains project database-related SQL.

`hsn_code.sql` contains HSN master data used by the HSN lookup functionality.

---

# 🔐 Security Configuration

The project uses:

* JWT authentication
* Django custom User model
* Role-based access
* CORS configuration
* CSRF trusted origins
* Protected frontend routes

Frontend protected routes are handled through:

```text
src/components/ProtectedRoute.jsx
```

---

# ⚠️ Important Security Note

**Do not commit passwords, secret keys, API keys or production credentials to GitHub.**

The Django `settings.py` should use environment variables for sensitive values.

Example:

```python
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")

DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
```

Create a local `.env` file and add it to `.gitignore`.

Example:

```text
.env
env/
__pycache__/
*.pyc
db.sqlite3
```

---

# 🚫 Files That Should Not Be Uploaded

Before pushing the project to GitHub, make sure these are excluded:

```text
env/
__pycache__/
*.pyc
db.sqlite3
.env
```

Also review the `shipping_bill_documents/` directory before committing because it currently contains uploaded documents and PDFs.

Do not publish real customer, identity, company, customs, or other confidential documents.

---

# 🧪 Development

Backend:

```bash
cd ISC-backend/isc_backend
env\Scripts\activate
python manage.py runserver
```

Frontend:

```bash
cd ISC-frontend
npm install
npm run dev
```

---

# 📌 Current Project Modules

```text
Authentication
      ↓
Company / Region / Zone
      ↓
Shipping Bill Creation
      ↓
Invoice Management
      ↓
Item & HSN Management
      ↓
Document Upload
      ↓
Document Verification
      ↓
Maker → Approver → DC → AC Workflow
      ↓
Queries & Responses
      ↓
LET Export
      ↓
AC Shipment Action
      ↓
Shipping Bill Print / Preview
```

---

# 🎯 Project Objective

The main objective of this project is to build a centralized digital platform for managing the **Sea Customs Shipping Bill process**.

The system aims to improve:

* Shipping Bill processing
* Document management
* Verification
* Query handling
* Role-based workflow
* Approval tracking
* HSN-based item processing
* PDF/document accessibility
* Communication between Maker, Approver, DC and AC users

---

# 👨‍💻 Author

**Bharath Kumar**

GitHub:
https://github.com/bharathkumar019

Repository:
https://github.com/bharathkumar019/Sea-Customs-Website-Shipping-Bill

---

# 📄 License

This project is intended for development, educational, and demonstration purposes.

---

## ⭐ Project

**Sea Customs Website – Shipping Bill Management System**

A full-stack solution combining:

**React + Vite + Django REST Framework + MySQL**

for end-to-end Shipping Bill workflow management.
