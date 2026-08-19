CREATE DATABASE ISC_database;
use ISC_database;
DROP DATABASE ISC_database;
CREATE TABLE hsn_master (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    hsn_code VARCHAR(20) NOT NULL UNIQUE,

    description VARCHAR(500) NOT NULL,

    product_category VARCHAR(150),hsn_master

    unit VARCHAR(30) NOT NULL,

    exportable BOOLEAN NOT NULL DEFAULT TRUE,

    export_declaration BOOLEAN NOT NULL DEFAULT FALSE,

    restricted BOOLEAN NOT NULL DEFAULT FALSE,

    prohibited BOOLEAN NOT NULL DEFAULT FALSE,

    hazardous BOOLEAN NOT NULL DEFAULT FALSE,

    igst_rate DECIMAL(6,2) NOT NULL DEFAULT 0.00,

    other_duty_rate DECIMAL(6,2) NOT NULL DEFAULT 0.00,

    risk_category ENUM(
        'LOW',
        'MEDIUM',
        'HIGH'
    ) NOT NULL DEFAULT 'LOW',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO hsn_master (
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
)
VALUES (
    '85171200',
    'Mobile communication equipment',
    'Electronics',
    'PCS',
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    4.00,
    2.00,
    'MEDIUM'
);


SELECT * FROM hsn_master;


INSERT INTO hsn_master (
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
)
VALUES
(
    '85183000',
    'Headphones and earphones',
    'Electronics',
    'PCS',
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    3.00,
    1.50,
    'LOW'
),
(
    '85287200',
    'Television receivers',
    'Electronics',
    'PCS',
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    2.50,
    1.00,
    'LOW'
);


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
WHERE hsn_code = '85171200';


