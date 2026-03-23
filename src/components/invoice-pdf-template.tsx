import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register Arabic font
Font.register({
  family: 'Tajawal',
  src: 'https://fonts.gstatic.com/s/tajawal/v9/Iura6YBj_oCad4k1nzCm.ttf',
});

const styles = StyleSheet.create({
  document: {
    fontFamily: 'Tajawal',
    direction: 'rtl',
  },
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #6c63ff',
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6c63ff',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  invoiceInfo: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoSection: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  table: {
    marginTop: 20,
    border: '1px solid #e5e5e5',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6c63ff',
    color: '#ffffff',
    padding: 10,
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1px solid #e5e5e5',
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
  },
  totals: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottom: '1px solid #e5e5e5',
  },
  totalLabel: {
    fontSize: 11,
    color: '#666',
  },
  totalValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f3f4f6',
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c63ff',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1px solid #e5e5e5',
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
  },
  status: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
});

interface InvoicePDFProps {
  invoice: {
    invoice_number: string;
    status: string;
    created_at: string;
    paid_at?: string | null;
  };
  tenant: {
    name_ar: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  subscription: {
    plan_name: string;
    amount: number;
    currency: string;
    period_start?: string | null;
    period_end?: string | null;
  };
}

export const InvoicePDF = ({
  invoice,
  tenant,
  customer,
  subscription,
}: InvoicePDFProps) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return styles.statusPaid;
      case 'pending':
        return styles.statusPending;
      case 'failed':
        return styles.statusFailed;
      default:
        return styles.statusPending;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوع';
      case 'pending':
        return 'قيد الانتظار';
      case 'failed':
        return 'مرفوض';
      default:
        return 'غير معروف';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  return (
    <Document>
      <Page size="A4" style={styles.document}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.logo}>{tenant.name_ar}</Text>
            </View>
            <View>
              <Text style={styles.invoiceTitle}>فاتورة</Text>
            </View>
          </View>

          <View style={styles.invoiceInfo}>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>رقم الفاتورة:</Text>
              <Text style={styles.infoValue}>{invoice.invoice_number}</Text>
              <Text style={[styles.status, getStatusStyle(invoice.status)]}>
                {getStatusText(invoice.status)}
              </Text>
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>تاريخ الإصدار:</Text>
              <Text style={styles.infoValue}>{formatDate(invoice.created_at)}</Text>
              <Text style={styles.infoLabel}>تاريخ الدفع:</Text>
              <Text style={styles.infoValue}>{formatDate(invoice.paid_at)}</Text>
            </View>
          </View>
        </View>

        {/* Customer & Tenant Info */}
        <View style={styles.invoiceInfo}>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>من:</Text>
            <Text style={styles.infoValue}>{tenant.name_ar}</Text>
            {tenant.email && <Text style={styles.infoValue}>{tenant.email}</Text>}
            {tenant.phone && <Text style={styles.infoValue}>{tenant.phone}</Text>}
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>إلى:</Text>
            <Text style={styles.infoValue}>{customer.name}</Text>
            {customer.email && <Text style={styles.infoValue}>{customer.email}</Text>}
            {customer.phone && <Text style={styles.infoValue}>{customer.phone}</Text>}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCell}>الوصف</Text>
            <Text style={styles.tableCell}>الفترة</Text>
            <Text style={styles.tableCell}>المبلغ</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>{subscription.plan_name}</Text>
            <Text style={styles.tableCell}>
              {formatDate(subscription.period_start)} - {formatDate(subscription.period_end)}
            </Text>
            <Text style={styles.tableCell}>
              {subscription.amount.toLocaleString('ar-SA')} {subscription.currency}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>المجموع الفرعي:</Text>
            <Text style={styles.totalValue}>
              {subscription.amount.toLocaleString('ar-SA')} {subscription.currency}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>الضريبة (15%):</Text>
            <Text style={styles.totalValue}>
              {(subscription.amount * 0.15).toLocaleString('ar-SA')} {subscription.currency}
            </Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>الإجمالي الكلي:</Text>
            <Text style={styles.grandTotalValue}>
              {(subscription.amount * 1.15).toLocaleString('ar-SA')} {subscription.currency}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>شكراً لثقتكم بنا</Text>
          <Text style={{ marginTop: 5 }}>
            للاستفسارات يرجى التواصل على {tenant.email || 'الدعم الفني'}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
