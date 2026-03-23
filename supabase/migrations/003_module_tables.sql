-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 003_module_tables.sql
-- Description: جداول الوحدات (E-commerce, Page Builder, Accounting, HRMS)
-- Created: 2025-03-20
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- ملاحظات مهمة
-- ───────────────────────────────────────────────────────────────────────────────
-- هذه الجداول تُنشأ فقط عند تفعيل الوحدة corresponding
-- كل جدول يحتوي على tenant_id للعزل
-- RLS يُطبّق على جميع الجداول

-- ═══════════════════════════════════════════════════════════════════════════════
-- MODULE 1: E-COMMERCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: products (المنتجات)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- المعلومات الأساسية
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description_ar TEXT,
  description_en TEXT,
  
  -- SKU
  sku VARCHAR(100),
  barcode VARCHAR(100),
  
  -- التسعير
  price NUMERIC(10, 2) NOT NULL,
  compare_at_price NUMERIC(10, 2),
  cost_price NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'SAR',
  
  -- الضريبة
  tax_rate NUMERIC(5, 2) DEFAULT 15,
  tax_included BOOLEAN DEFAULT false,
  
  -- المخزون
  track_inventory BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  allow_backorder BOOLEAN DEFAULT false,
  
  -- الحالة
  status VARCHAR(20) DEFAULT 'draft',
  -- draft | active | archived | out_of_stock
  
  -- النوع
  product_type VARCHAR(50) DEFAULT 'simple',
  -- simple | variable | digital | service
  
  -- الوزن والأبعاد
  weight NUMERIC(10, 2),
  weight_unit VARCHAR(10) DEFAULT 'kg',
  dimensions JSONB,
  -- {"length": 10, "width": 5, "height": 3, "unit": "cm"}
  
  -- الصور
  images JSONB DEFAULT '[]'::jsonb,
  -- [{"url": "...", "alt": "...", "position": 0}]
  
  -- التصنيفات
  category_ids UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- المتغيرات (للـ variable products)
  variants JSONB DEFAULT '[]'::jsonb,
  -- [{"sku": "...", "price": 100, "options": {"color": "red", "size": "M"}}]
  
  -- خيارات المنتج
  options JSONB DEFAULT '[]'::jsonb,
  -- [{"name": "اللون", "values": ["أحمر", "أزرق"]}]
  
  -- SEO
  seo_title VARCHAR(200),
  seo_description TEXT,
  seo_keywords TEXT[],
  slug VARCHAR(200),
  
  -- الشحن
  shipping_class VARCHAR(50),
  free_shipping BOOLEAN DEFAULT false,
  shipping_weight NUMERIC(10, 2),
  
  -- إعدادات إضافية
  settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- التواريخ
  published_at TIMESTAMPTZ,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_ids ON products USING GIN(category_ids);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_published_at ON products(published_at);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: product_categories (تصنيفات المنتجات)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- التسلسل الهرمي
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  
  -- الصورة
  image_url TEXT,
  
  -- SEO
  seo_title VARCHAR(200),
  seo_description TEXT,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_categories_tenant_id ON product_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_tenant_slug 
  ON product_categories(tenant_id, slug);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: orders (الطلبات)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- رقم الطلب
  order_number VARCHAR(50) NOT NULL,
  -- مثال: ORD-2025-000001
  
  -- حالة الطلب
  status VARCHAR(30) DEFAULT 'pending',
  -- pending | confirmed | processing | shipped | delivered | cancelled | refunded
  
  -- معلومات العميل
  customer_id UUID,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(20),
  
  -- العناصر
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{"product_id": "...", "variant_id": "...", "name": "...", "sku": "...", 
  --   "quantity": 2, "price": 100, "total": 200}]
  
  -- الأسعار
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SAR',
  
  -- الشحن
  shipping_method VARCHAR(100),
  shipping_address JSONB,
  -- {"street": "...", "city": "...", "region": "...", "postal_code": "...", "country": "SA"}
  
  -- الفوترة
  billing_address JSONB,
  
  -- الدفع
  payment_method VARCHAR(50),
  payment_status VARCHAR(30) DEFAULT 'pending',
  -- pending | paid | failed | refunded
  myfatoorah_invoice_id VARCHAR(100),
  paid_at TIMESTAMPTZ,
  
  -- الشحن
  tracking_number VARCHAR(100),
  shipping_carrier VARCHAR(100),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- ملاحظات
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- كوبون
  coupon_code VARCHAR(50),
  coupon_discount NUMERIC(10, 2) DEFAULT 0,
  
  -- بيانات إضافية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: order_items (عناصر الطلب)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID,
  
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(100),
  
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  
  options JSONB DEFAULT '{}'::jsonb,
  -- {"color": "أحمر", "size": "M"}
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: cart (سلة التسوق)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- معرف العميل (للمسجلين)
  customer_id UUID,
  
  -- sesiion ID (لغير المسجلين)
  session_id VARCHAR(100),
  
  -- العناصر
  items JSONB DEFAULT '[]'::jsonb,
  -- [{"product_id": "...", "variant_id": "...", "quantity": 2}]
  
  -- كوبون
  coupon_code VARCHAR(50),
  
  -- التواريخ
  expires_at TIMESTAMPTZ,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_carts_tenant_id ON carts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_expires_at ON carts(expires_at);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: coupons (كوبونات الخصم)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  code VARCHAR(50) NOT NULL,
  description TEXT,
  
  -- نوع الخصم
  discount_type VARCHAR(20) NOT NULL,
  -- percentage | fixed
  
  -- قيمة الخصم
  discount_value NUMERIC(10, 2) NOT NULL,
  
  -- الشروط
  min_order_amount NUMERIC(10, 2) DEFAULT 0,
  max_discount_amount NUMERIC(10, 2),
  usage_limit INTEGER,
  usage_limit_per_customer INTEGER,
  
  -- المنتجات/التصنيفات
  applicable_products UUID[] DEFAULT '{}',
  applicable_categories UUID[] DEFAULT '{}',
  excluded_products UUID[] DEFAULT '{}',
  
  -- الفترة
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  
  -- عدد مرات الاستخدام
  times_used INTEGER DEFAULT 0,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_tenant_id ON coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_dates ON coupons(starts_at, ends_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MODULE 2: PAGE BUILDER
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: pages (الصفحات)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- المعلومات الأساسية
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  
  -- نوع الصفحة
  page_type VARCHAR(50) DEFAULT 'custom',
  -- custom | home | about | contact | product | collection
  
  -- المحتوى
  content JSONB DEFAULT '[]'::jsonb,
  -- Blocks: [{"type": "hero", "data": {...}}, {"type": "features", "data": {...}}]
  
  -- HTML مخصص
  custom_html TEXT,
  custom_css TEXT,
  custom_js TEXT,
  
  -- القالب
  template_id UUID,
  template_name VARCHAR(100),
  
  -- الحالة
  status VARCHAR(20) DEFAULT 'draft',
  -- draft | published | archived
  
  -- SEO
  seo_title VARCHAR(200),
  seo_description TEXT,
  seo_keywords TEXT[],
  og_image_url TEXT,
  
  -- الوصول
  is_public BOOLEAN DEFAULT true,
  password VARCHAR(100),
  
  -- الترتيب
  sort_order INTEGER DEFAULT 0,
  
  -- البيانات الوصفية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- التواريخ
  published_at TIMESTAMPTZ,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_tenant_slug ON pages(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_pages_tenant_id ON pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_page_type ON pages(page_type);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: blocks (مكونات البناء)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- اسم البلوك
  name VARCHAR(100) NOT NULL,
  
  -- نوع البلوك
  block_type VARCHAR(50) NOT NULL,
  -- hero | features | testimonials | gallery | cta | faq | ...
  
  -- التصنيف
  category VARCHAR(50),
  
  -- المحتوى
  content JSONB NOT NULL,
  -- البيانات القابلة للتخصيص
  
  -- الأنماط
  styles JSONB DEFAULT '{}'::jsonb,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  
  -- الترتيب
  sort_order INTEGER DEFAULT 0,
  
  -- البيانات الوصفية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocks_tenant_id ON blocks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_blocks_category ON blocks(category);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: themes (القوالب)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- المعلومات الأساسية
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- نوع القالب
  theme_type VARCHAR(50) DEFAULT 'custom',
  -- custom | marketplace
  
  -- الحالة
  is_active BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  
  -- الإعدادات
  settings JSONB DEFAULT '{}'::jsonb,
  -- {"primary_color": "#6c63ff", "font_family": "IBM Plex Sans Arabic", ...}
  
  -- الألوان
  color_palette JSONB DEFAULT '{}'::jsonb,
  
  -- الخطوط
  fonts JSONB DEFAULT '{}'::jsonb,
  
  -- CSS مخصص
  custom_css TEXT,
  
  -- المعاينة
  preview_url TEXT,
  screenshot_url TEXT,
  
  -- للـ Marketplace
  author_id UUID,
  author_name VARCHAR(100),
  price NUMERIC(10, 2) DEFAULT 0,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_themes_tenant_id ON themes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_themes_is_active ON themes(is_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MODULE 3: ACCOUNTING (ZATCA-Ready)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: accounts (الحسابات المحاسبية)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- المعلومات الأساسية
  name_ar VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  account_number VARCHAR(50) NOT NULL,
  
  -- نوع الحساب
  account_type VARCHAR(50) NOT NULL,
  -- asset | liability | equity | revenue | expense
  
  -- التصنيف
  category VARCHAR(100),
  parent_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- الرصيد
  balance NUMERIC(15, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'SAR',
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  
  -- البيانات الوصفية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_tenant_number 
  ON accounts(tenant_id, account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant_id ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_parent_id ON accounts(parent_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: journal_entries (القيد اليومية)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- رقم القيد
  entry_number VARCHAR(50) NOT NULL,
  
  -- التاريخ
  entry_date DATE NOT NULL,
  
  -- الوصف
  description TEXT,
  
  -- النوع
  entry_type VARCHAR(50) DEFAULT 'manual',
  -- manual | auto | system | recurring
  
  -- الحالة
  status VARCHAR(20) DEFAULT 'draft',
  -- draft | posted | void
  
  -- مرجع
  reference_type VARCHAR(50),
  reference_id UUID,
  
  -- إجمالي المبالغ
  total_debit NUMERIC(15, 2) DEFAULT 0,
  total_credit NUMERIC(15, 2) DEFAULT 0,
  
  -- البيانات الوصفية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  posted_at TIMESTAMPTZ
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_number 
  ON journal_entries(tenant_id, entry_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_id ON journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: journal_entry_lines (أسطر القيد)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  
  description TEXT,
  
  debit NUMERIC(15, 2) DEFAULT 0,
  credit NUMERIC(15, 2) DEFAULT 0,
  
  -- البيانات الوصفية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry_id ON journal_entry_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_tenant_id ON journal_entry_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account_id ON journal_entry_lines(account_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: invoices_ar (الفواتير الضريبية - ZATCA)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices_ar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- رقم الفاتورة
  invoice_number VARCHAR(50) NOT NULL,
  
  -- نوع الفاتورة
  invoice_type VARCHAR(30) DEFAULT 'standard',
  -- standard | simplified | debit_note | credit_note
  
  -- حالة ZATCA
  zatca_status VARCHAR(30) DEFAULT 'pending',
  -- pending | submitted | cleared | rejected
  
  -- UUID الفاتورة (ZATCA)
  zatca_uuid UUID,
  zatca_hash TEXT,
  zatca_qr_code TEXT,
  
  -- معلومات العميل
  customer_id UUID,
  customer_name VARCHAR(200),
  customer_vat_number VARCHAR(20),
  customer_address JSONB,
  
  -- العناصر
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- الأسعار
  subtotal NUMERIC(15, 2) NOT NULL,
  tax_amount NUMERIC(15, 2) DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SAR',
  
  -- التواريخ
  issue_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  
  -- الحالة
  payment_status VARCHAR(30) DEFAULT 'unpaid',
  -- unpaid | partial | paid
  
  -- XML (لـ ZATCA)
  xml_content TEXT,
  xml_signed_content TEXT,
  
  -- البيانات الوصفية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_ar_number 
  ON invoices_ar(tenant_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_ar_tenant_id ON invoices_ar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_ar_zatca_status ON invoices_ar(zatca_status);
CREATE INDEX IF NOT EXISTS idx_invoices_ar_issue_date ON invoices_ar(issue_date);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MODULE 4: HRMS (الموارد البشرية)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: employees (الموظفين)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- المعلومات الشخصية
  employee_number VARCHAR(50) NOT NULL,
  first_name_ar VARCHAR(100) NOT NULL,
  last_name_ar VARCHAR(100) NOT NULL,
  first_name_en VARCHAR(100),
  last_name_en VARCHAR(100),
  
  -- معلومات الاتصال
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  
  -- الهوية
  id_number VARCHAR(20),
  id_expiry_date DATE,
  nationality VARCHAR(2) DEFAULT 'SA',
  
  -- الوظيفة
  department VARCHAR(100),
  job_title VARCHAR(100),
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- التوظيف
  hire_date DATE NOT NULL,
  employment_type VARCHAR(30) DEFAULT 'full_time',
  -- full_time | part_time | contract | intern
  
  -- الراتب
  base_salary NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SAR',
  salary_structure JSONB DEFAULT '{}'::jsonb,
  -- {"basic": 8000, "housing": 2000, "transport": 500, ...}
  
  -- حالة الموظف
  status VARCHAR(20) DEFAULT 'active',
  -- active | on_leave | terminated | suspended
  
  -- تاريخ الانتهاء (للعقود)
  contract_end_date DATE,
  termination_date DATE,
  termination_reason TEXT,
  
  -- معلومات GOSI
  gosi_number VARCHAR(50),
  gosi_registered BOOLEAN DEFAULT false,
  
  -- المستندات
  documents JSONB DEFAULT '[]'::jsonb,
  -- [{"type": "contract", "url": "...", "uploaded_at": "..."}]
  
  -- البيانات الوصفية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_number 
  ON employees(tenant_id, employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: payroll (الرواتب)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- فترة الراتب
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- حالة الدفع
  status VARCHAR(20) DEFAULT 'draft',
  -- draft | approved | paid
  
  -- إجمالي الرواتب
  total_gross NUMERIC(15, 2) DEFAULT 0,
  total_deductions NUMERIC(15, 2) DEFAULT 0,
  total_net NUMERIC(15, 2) DEFAULT 0,
  
  -- ملاحظات
  notes TEXT,
  
  -- تمت الموافقة بواسطة
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_tenant_id ON payroll(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

-- ───────────────────────────────────────────────────────────────────────────────
-- Table: payroll_items (عناصر الرواتب)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payroll_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_id UUID NOT NULL REFERENCES payroll(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- المبالغ
  gross_salary NUMERIC(10, 2) NOT NULL,
  allowances NUMERIC(10, 2) DEFAULT 0,
  deductions NUMERIC(10, 2) DEFAULT 0,
  bonus NUMERIC(10, 2) DEFAULT 0,
  overtime NUMERIC(10, 2) DEFAULT 0,
  net_salary NUMERIC(10, 2) NOT NULL,
  
  -- التفاصيل
  breakdown JSONB DEFAULT '{}'::jsonb,
  -- {"basic": 8000, "housing": 2000, "gosi": 200, ...}
  
  -- حالة الدفع
  payment_status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_items_payroll_id ON payroll_items(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee_id ON payroll_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_tenant_id ON payroll_items(tenant_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS Policies for Module Tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function للتحقق من tenant isolation
CREATE OR REPLACE FUNCTION check_tenant_access(table_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_super_admin() OR is_tenant_member(table_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- E-Commerce RLS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_isolation ON products FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_isolation ON product_categories FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_isolation ON orders FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_items_isolation ON order_items FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY carts_isolation ON carts FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY coupons_isolation ON coupons FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

-- ═══════════════════════════════════════════════════════════════════════════════
-- Page Builder RLS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY pages_isolation ON pages FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY blocks_isolation ON blocks FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY themes_isolation ON themes FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

-- ═══════════════════════════════════════════════════════════════════════════════
-- Accounting RLS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY accounts_isolation ON accounts FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_entries_isolation ON journal_entries FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_lines_isolation ON journal_entry_lines FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE invoices_ar ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_ar_isolation ON invoices_ar FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

-- ═══════════════════════════════════════════════════════════════════════════════
-- HRMS RLS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY employees_isolation ON employees FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY payroll_isolation ON payroll FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY payroll_items_isolation ON payroll_items FOR ALL
  USING (check_tenant_access(tenant_id))
  WITH CHECK (check_tenant_access(tenant_id));

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Migration
-- ═══════════════════════════════════════════════════════════════════════════════
