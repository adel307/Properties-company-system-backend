import prisma from '../db.js';
import { byId, asyncHandler, paginated, remove } from './crud.js';

export const listMaterials = paginated(prisma.material, { include: { supplier: true, property: true }, orderBy: { arriveDate: 'desc' } });

export const getMaterial = byId(prisma.material, { supplier: true, property: true });

function normalizeMaterial(data) {
  const totalPrice = Number(data.totalPrice);
  const paidPrice = Number(data.paidPrice);
  const status = data.status;

  const arriveDate = data.arriveDate ? new Date(data.arriveDate) : new Date();

  let paymentDate;
  if (data.paymentDate) {
    paymentDate = new Date(data.paymentDate);
  } else {
    paymentDate = new Date(arriveDate);
    paymentDate.setUTCMonth(paymentDate.getUTCMonth() + 1);
  }

  console.log('normalizeMaterial:', { totalPrice, paidPrice, arriveDate, paymentDate, status });``

  return { ...data, totalPrice, paidPrice, arriveDate, remainingAmount: status === 'paid' ? 0 : Math.max(totalPrice - paidPrice, 0), paymentDate };
}

export const createMaterial = asyncHandler(async (req, res) => res.status(201).json({ data: await prisma.material.create({ data: normalizeMaterial(req.body) }) }));

export const updateMaterial = asyncHandler(async (req, res) => {
  const current = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ error: 'Not found' });
  const data = normalizeMaterial({ ...current, ...req.body });
  res.json({ data: await prisma.material.update({ where: { id: req.params.id }, data }) });
});

export const deleteMaterial = remove(prisma.material);
