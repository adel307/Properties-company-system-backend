import prisma from '../db.js';
import { asyncHandler, byId, create, pagination, remove, update } from './crud.js';

const sortable = new Set(['dueDate', 'totalAmount', 'paidAmount', 'remainingAmount', 'status', 'createdAt', 'updatedAt']);

function buildLeasePaymentWhere(query) {
  const where = {};
  const status = query.status ?? query.payment_status;
  const leaseId = query.lease_id ?? query.leaseId;

  if (status) where.status = status;
  if (leaseId) where.leaseId = leaseId;

  const search = query.search?.trim();
  if (search) {
    where.OR = [
      { lease: { tenant: { name: { contains: search, mode: 'insensitive' } } } },
      { lease: { apartment: { name: { contains: search, mode: 'insensitive' } } } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export const listLeasePayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const where = buildLeasePaymentWhere(req.query);
  const orderBy = sortable.has(req.query.sort_by)
    ? { [req.query.sort_by]: 'asc' }
    : { dueDate: 'asc' };

  const [data, total] = await prisma.$transaction([
    prisma.leasePayment.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        lease: {
          include: {
            tenant: true,
            apartment: true,
          },
        },
        transactions: true,
      },
    }),
    prisma.leasePayment.count({ where }),
  ]);

  res.json({
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getLeasePayment = byId(prisma.leasePayment, {
  lease: {
    include: {
      tenant: true,
      apartment: true,
    },
  },
  transactions: true,
});

export const createLeasePayment = create(prisma.leasePayment);
export const updateLeasePayment = update(prisma.leasePayment);
export const deleteLeasePayment = remove(prisma.leasePayment);
