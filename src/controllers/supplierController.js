import prisma from '../db.js';
import { asyncHandler, byId, create, pagination, remove, update } from './crud.js';

export const listSuppliers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const search = req.query.search?.trim();
  const debtOnly = req.query.has_debt === 'true';
  const where = { ...(search && { name: { contains: search, mode: 'insensitive' } }), ...(debtOnly && { materials: { some: { status: 'as_dept', remainingAmount: { gt: 0 } } } }) };
  const [data, total] = await prisma.$transaction([prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }), prisma.supplier.count({ where })]);
  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
export const getSupplier = byId(prisma.supplier, { materials: true });
export const createSupplier = create(prisma.supplier);
export const updateSupplier = update(prisma.supplier);
export const deleteSupplier = remove(prisma.supplier);
export const supplierDebt = asyncHandler(async (req, res) => {
  const result = await prisma.$queryRaw`SELECT id, name, total_debt FROM v_suppliers_with_debt WHERE id = ${req.params.id}::uuid`;
  if (!result.length) return res.status(404).json({ error: 'Not found' });
  return res.json({ data: result[0] });
});
export const totalDebt = asyncHandler(async (_req, res) => {
  const result = await prisma.$queryRaw`SELECT COALESCE(SUM(total_debt), 0) AS total_debt FROM v_suppliers_with_debt`;
  res.json({ data: result[0] });
});
export const supplierDetails = asyncHandler(
  async (_req, res) =>{
    console.log('Fetching supplier details'); 
    res.json({ data: await prisma.$queryRaw`SELECT * FROM v_supplier_materials ORDER BY supplier_name, material_name` })
  }
);

