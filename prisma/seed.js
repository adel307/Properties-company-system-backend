import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Seeding and View creation Process...');

  // ==========================================
  // 1. Create SQL Views & Indexes
  // ==========================================

  console.log('📊 Creating Database Views...');

  // 1.1 View: v_suppliers_with_debt
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE VIEW v_suppliers_with_debt AS
    SELECT 
        s.id,
        s.name,
        s.updated_at,
        COALESCE(SUM(m.remaining_amount), 0) AS total_debt
    FROM suppliers s
    LEFT JOIN materials m 
        ON s.id = m.supplier_id 
        AND m.status = 'as_dept'
    GROUP BY s.id, s.name, s.updated_at;
  `);

  // 1.2 View: v_supplier_materials (SuppliersDetails)
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE VIEW v_supplier_materials AS
    SELECT 
        s.id AS supplier_id,
        s.name AS supplier_name,
        s.updated_at AS supplier_updated_at,
        m.id AS material_id,
        m.name AS material_name,
        m.total_price,
        m.paid_price,
        m.remaining_amount,
        m.status,
        m.quantity,
        m.arrive_date,
        m.payment_date,
        m.property_id,
        m.updated_at AS material_updated_at
    FROM suppliers s
    LEFT JOIN materials m ON s.id = m.supplier_id;
  `);

  // 1.3 View: v_daily_expenses_ordered_by_date
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE VIEW v_daily_expenses_ordered_by_date AS
    SELECT 
        de.id,
        de.sender,
        de.amount,
        de.expense_category_id,
        de.expense_date,
        de.paid_to,
        de.payment_method,
        de.receipt_number,
        de.receipt_image_url,
        de.approved_by,
        de.notes,
        de.created_at
    FROM daily_expenses de
    ORDER BY de.expense_date DESC;
  `);

  console.log('⚡ Creating Performance Indexes...');

  // 1.4 Create Indexes on Materials
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_materials_supplier_status 
    ON materials (supplier_id, status);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_materials_supplier_status_covering 
    ON materials (supplier_id, status, remaining_amount);
  `);

  // ==========================================
  // 2. Seed Initial Dummy Data
  // ==========================================

  console.log('🌱 Seeding initial records...');

  await prisma.material.deleteMany();
  await prisma.dailyExpense.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.propertyEmployee.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.property.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.supplier.deleteMany();

  const emp1 = await prisma.employee.create({
    data: {
      name: 'أحمد محمود',
      salary: 12000.00,
      experienceYears: 5,
      age: 30,
      phone: '01000000001'
    }
  });

  const emp2 = await prisma.employee.create({
    data: {
      name: 'محمد علي',
      salary: 15000.00,
      experienceYears: 7,
      age: 34,
      phone: '01100000002'
    }
  });

  const sup1 = await prisma.supplier.create({
    data: { name: 'شركة الأهرام للحديد والصلب' }
  });

  const sup2 = await prisma.supplier.create({
    data: { name: 'مورد السيراميك والأسمنت الحديث' }
  });

  const property1 = await prisma.property.create({
    data: {
      name: 'برج الأمل',
      status: 'under_construction',
      address: 'القاهرة - مدينة نصر',
      startedIn: new Date('2025-01-01'),
      floorsNumber: 10,
      area: 500.50
    }
  });

  await prisma.propertyEmployee.create({
    data: {
      propertyId: property1.id,
      employeeId: emp1.id,
      role: 'مهندس موقع'
    }
  });

  await prisma.apartment.createMany({
    data: [
      { propertyId: property1.id, floor: 1, number: '101' },
      { propertyId: property1.id, floor: 1, number: '102' },
      { propertyId: property1.id, floor: 2, number: '201' }
    ]
  });

  const cat1 = await prisma.expenseCategory.create({
    data: { name: 'نثريات ومطبوعات' }
  });

  const cat2 = await prisma.expenseCategory.create({
    data: { name: 'صيانة ومعدات' }
  });

  await prisma.dailyExpense.createMany({
    data: [
      {
        sender: 'إدارة الموقع',
        amount: 350.00,
        expenseCategoryId: cat1.id,
        expenseDate: new Date('2026-09-01'),
        paidTo: 'مكتبة النور',
        paymentMethod: 'CASH',
        approvedBy: 'أحمد محمود',
        notes: 'طباعة الخرائط والرسومات الهندسية'
      },
      {
        sender: 'الحسابات',
        amount: 2500.00,
        expenseCategoryId: cat2.id,
        expenseDate: new Date('2026-09-10'),
        paidTo: 'شركة الصيانة',
        paymentMethod: 'BANK_TRANSFER',
        receiptNumber: 'TXN-998231',
        receiptImageUrl: 'https://storage.example.com/receipts/rec_1.png',
        approvedBy: 'محمد علي',
        notes: 'صيانة مولد الكهرباء'
      }
    ]
  });

  const arriveDate1 = new Date('2026-08-01');
  const paymentDate1 = new Date('2026-09-01');

  await prisma.material.create({
    data: {
      name: 'حديد تسليح 12مم',
      totalPrice: 50000.00,
      paidPrice: 20000.00,
      status: 'as_dept',
      quantity: 10.5,
      arriveDate: arriveDate1,
      remainingAmount: 30000.00,
      paymentDate: paymentDate1,
      supplierId: sup1.id,
      propertyId: property1.id
    }
  });

  await prisma.material.create({
    data: {
      name: 'أسمنت بورتلاندي',
      totalPrice: 15000.00,
      paidPrice: 15000.00,
      status: 'paid',
      quantity: 50.0,
      arriveDate: arriveDate1,
      remainingAmount: 0.00,
      paymentDate: paymentDate1,
      supplierId: sup2.id,
      propertyId: property1.id
    }
  });

  console.log('✅ Seeding & View setup completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });