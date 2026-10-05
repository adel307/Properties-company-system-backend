import prisma from '../db.js';
import { asyncHandler, byId, create, pagination, remove, update } from './crud.js';

const sortable = new Set(['amountPaid', 'paymentDate', 'paymentMethod', 'createdAt']);

function buildPaymentTransactionWhere(query) {
  const where = {};
  const paymentMethod = query.payment_method ?? query.paymentMethod;
  const leasePaymentId = query.lease_payment_id ?? query.leasePaymentId;

  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (leasePaymentId) where.leasePaymentId = leasePaymentId;

  const search = query.search?.trim();
  if (search) {
    where.OR = [
      { receiptNumber: { contains: search, mode: 'insensitive' } },
      { receivedBy: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
      { leasePayment: { lease: { tenant: { name: { contains: search, mode: 'insensitive' } } } } },
    ];
  }

  return where;
}

export const listPaymentTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const where = buildPaymentTransactionWhere(req.query);
  const orderBy = sortable.has(req.query.sort_by)
    ? { [req.query.sort_by]: 'asc' }
    : { paymentDate: 'desc' };

  const [data, total] = await prisma.$transaction([
    prisma.paymentTransaction.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        leasePayment: {
          include: {
            lease: {
              include: {
                tenant: true,
                apartment: true,
              },
            },
          },
        },
      },
    }),
    prisma.paymentTransaction.count({ where }),
  ]);

  res.json({
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getPaymentTransaction = byId(prisma.paymentTransaction, {
  leasePayment: {
    include: {
      lease: {
        include: {
          tenant: true,
          apartment: true,
        },
      },
    },
  },
});

export const createPaymentTransaction = create(prisma.paymentTransaction);
export const updatePaymentTransaction = update(prisma.paymentTransaction);
export const deletePaymentTransaction = remove(prisma.paymentTransaction);
