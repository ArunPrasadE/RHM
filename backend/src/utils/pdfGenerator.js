import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Format currency in Indian Rupees
 */
function formatCurrency(amount) {
  return `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Generate PDF report for a tenant
 */
export async function generateTenantPDF(tenant, payments) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Tenant Report', 105, 20, { align: 'center' });

  // Tenant details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  let y = 35;

  doc.setFont('helvetica', 'bold');
  doc.text('Tenant Details', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const tenantDetails = [
    ['Name:', tenant.name],
    ['Phone:', tenant.phone || '-'],
    ['ID Proof:', tenant.id_proof_number || '-'],
    ['Occupation:', tenant.occupation || '-'],
    ['Household Members:', String(tenant.household_members || '-')],
    ['Move-in Date:', formatDate(tenant.move_in_date)],
    ['Move-out Date:', tenant.move_out_date ? formatDate(tenant.move_out_date) : 'Current Tenant'],
    ['Advance Amount:', formatCurrency(tenant.advance_amount)],
  ];

  const houseDetails = [
    ['House Number:', tenant.house_number],
    ['Address:', tenant.address || '-'],
    ['Current Rent:', formatCurrency(tenant.rent_amount)],
  ];

  // Two columns for details
  tenantDetails.forEach((detail, i) => {
    doc.text(detail[0], 14, y);
    doc.text(detail[1], 50, y);
    y += 6;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('House Details', 14, y);
  y += 8;
  doc.setFont('helvetica', 'normal');

  houseDetails.forEach((detail) => {
    doc.text(detail[0], 14, y);
    doc.text(detail[1], 50, y);
    y += 6;
  });

  // Payment history table
  y += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment History', 14, y);
  y += 5;

  const tableData = payments.map(p => [
    formatDate(p.due_date),
    formatCurrency(p.due_amount),
    formatCurrency(p.paid_amount),
    formatCurrency(p.due_amount - p.paid_amount),
    p.is_fully_paid ? 'Paid' : 'Pending',
    p.payment_date ? formatDate(p.payment_date) : '-',
    p.payment_method || '-'
  ]);

  doc.autoTable({
    startY: y,
    head: [['Due Date', 'Due Amount', 'Paid', 'Pending', 'Status', 'Payment Date', 'Method']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 18 },
      5: { cellWidth: 25 },
      6: { cellWidth: 22 }
    }
  });

  // Summary
  const totalDue = payments.reduce((sum, p) => sum + p.due_amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.paid_amount, 0);
  const totalPending = payments.reduce((sum, p) => sum + (p.due_amount - p.paid_amount), 0);

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Due: ${formatCurrency(totalDue)}`, 14, finalY);
  doc.text(`Total Paid: ${formatCurrency(totalPaid)}`, 80, finalY);
  doc.text(`Total Pending: ${formatCurrency(totalPending)}`, 140, finalY);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 14, 285);

  return doc.output('arraybuffer');
}

/**
 * Generate PDF report for a house
 */
export async function generateHousePDF(house, tenants, expenses, maintenanceExpenses) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`House Report - ${house.house_number}`, 105, 20, { align: 'center' });

  let y = 35;

  // House details
  doc.setFontSize(12);
  doc.text('House Details', 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const houseDetails = [
    ['House Number:', house.house_number],
    ['Address:', house.address || '-'],
    ['Type:', house.type || '-'],
    ['Size:', house.size_sqft ? `${house.size_sqft} sq.ft` : '-'],
    ['EB Service No:', house.eb_service_number || '-'],
    ['Motor Service No:', house.motor_service_number || '-'],
    ['Rent Amount:', formatCurrency(house.rent_amount)],
  ];

  houseDetails.forEach((detail) => {
    doc.text(detail[0], 14, y);
    doc.text(detail[1], 55, y);
    y += 6;
  });

  // Tenant history
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Tenant History', 14, y);
  y += 5;

  const tenantTableData = tenants.map(t => [
    t.name,
    t.phone || '-',
    formatDate(t.move_in_date),
    t.move_out_date ? formatDate(t.move_out_date) : 'Current',
    formatCurrency(t.advance_amount)
  ]);

  doc.autoTable({
    startY: y,
    head: [['Name', 'Phone', 'Move-in', 'Move-out', 'Advance']],
    body: tenantTableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 }
  });

  // Expenses
  y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Expenses', 14, y);
  y += 5;

  const expenseTableData = expenses.map(e => [
    e.expense_type.replace('_', ' ').toUpperCase(),
    formatCurrency(e.amount),
    e.due_date ? formatDate(e.due_date) : '-',
    e.is_paid ? 'Paid' : 'Pending',
    e.paid_date ? formatDate(e.paid_date) : '-'
  ]);

  doc.autoTable({
    startY: y,
    head: [['Type', 'Amount', 'Due Date', 'Status', 'Paid Date']],
    body: expenseTableData,
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11] },
    styles: { fontSize: 9 }
  });

  // Maintenance expenses
  if (maintenanceExpenses.length > 0) {
    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Maintenance Expenses', 14, y);
    y += 5;

    const maintenanceTableData = maintenanceExpenses.map(m => [
      m.description,
      formatDate(m.expense_date),
      formatCurrency(m.split_amount),
      m.is_shared ? 'Shared' : 'Single'
    ]);

    doc.autoTable({
      startY: y,
      head: [['Description', 'Date', 'Share Amount', 'Type']],
      body: maintenanceTableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9 }
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 14, 285);

  return doc.output('arraybuffer');
}

/**
 * Generate yearly financial report PDF
 */
export async function generateYearlyReportPDF(year, houses, monthlyIncome, expenses, maintenance) {
  const doc = new jsPDF('landscape');

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`Yearly Financial Report - ${year}`, 148, 20, { align: 'center' });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Build data for each house
  const tableData = houses.map(house => {
    const row = [house.house_number];

    // Monthly income
    let totalIncome = 0;
    months.forEach((_, idx) => {
      const monthNum = String(idx + 1).padStart(2, '0');
      const income = monthlyIncome.find(m => m.house_id === house.id && m.month === monthNum);
      const collected = income?.collected || 0;
      totalIncome += collected;
      row.push(collected > 0 ? formatCurrency(collected) : '-');
    });

    row.push(formatCurrency(totalIncome));

    // Total expenses
    const houseExpenses = expenses.filter(e => e.house_id === house.id);
    const totalExpenses = houseExpenses.reduce((sum, e) => sum + e.total, 0);

    const houseMaintenance = maintenance.find(m => m.house_id === house.id);
    const totalMaintenance = houseMaintenance?.total || 0;

    row.push(formatCurrency(totalExpenses + totalMaintenance));
    row.push(formatCurrency(totalIncome - totalExpenses - totalMaintenance));

    return row;
  });

  // Add totals row
  const totalsRow = ['TOTAL'];
  let grandTotalIncome = 0;
  let grandTotalExpenses = 0;

  months.forEach((_, idx) => {
    const monthNum = String(idx + 1).padStart(2, '0');
    const monthTotal = monthlyIncome
      .filter(m => m.month === monthNum)
      .reduce((sum, m) => sum + (m.collected || 0), 0);
    grandTotalIncome += monthTotal;
    totalsRow.push(monthTotal > 0 ? formatCurrency(monthTotal) : '-');
  });

  totalsRow.push(formatCurrency(grandTotalIncome));

  const allExpensesTotal = expenses.reduce((sum, e) => sum + e.total, 0);
  const allMaintenanceTotal = maintenance.reduce((sum, m) => sum + m.total, 0);
  grandTotalExpenses = allExpensesTotal + allMaintenanceTotal;

  totalsRow.push(formatCurrency(grandTotalExpenses));
  totalsRow.push(formatCurrency(grandTotalIncome - grandTotalExpenses));

  tableData.push(totalsRow);

  const headers = ['House', ...months, 'Total Income', 'Expenses', 'Net Profit'];

  doc.autoTable({
    startY: 30,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      13: { fontStyle: 'bold' },
      14: { fontStyle: 'bold' },
      15: { fontStyle: 'bold' }
    },
    footStyles: { fontStyle: 'bold' }
  });

  // Summary section
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, finalY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Income: ${formatCurrency(grandTotalIncome)}`, 14, finalY + 8);
  doc.text(`Total Expenses: ${formatCurrency(grandTotalExpenses)}`, 80, finalY + 8);
  doc.text(`Net Profit: ${formatCurrency(grandTotalIncome - grandTotalExpenses)}`, 150, finalY + 8);

  // Footer
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 14, 200);

  return doc.output('arraybuffer');
}

export default {
  generateTenantPDF,
  generateHousePDF,
  generateYearlyReportPDF
};
