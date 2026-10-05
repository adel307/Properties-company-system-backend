import prisma from '../db.js';
import { asyncHandler, byId, create, pagination, remove, update } from './crud.js';

const sortable = new Set(['startDate', 'endDate', 'rentAmount', 'deposit', 'status', 'createdAt', 'updatedAt']);

function buildLeaseWhere(query) {
  const where = {};
  const status = query.status ?? query.leasing_status;
  const apartmentId = query.apartment_id ?? query.apartmentId;
  const tenantId = query.tenant_id ?? query.tenantId;

  if (status) where.status = status;
  if (apartmentId) where.apartmentId = apartmentId;
  if (tenantId) where.tenantId = tenantId;

  const search = query.search?.trim();
  if (search) {
    where.OR = [
      { tenant: { name: { contains: search, mode: 'insensitive' } } },
      { apartment: { name: { contains: search, mode: 'insensitive' } } },
      { apartment: { address: { contains: search, mode: 'insensitive' } } },
    ];
  }

  return where;
}

export const listLeases = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const where = buildLeaseWhere(req.query);
  const orderBy = sortable.has(req.query.sort_by)
    ? { [req.query.sort_by]: 'asc' }
    : { startDate: 'desc' };

  const [data, total] = await prisma.$transaction([
    prisma.lease.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        apartment: true,
        tenant: true,
        payments: {
          orderBy: { dueDate: 'asc' },
          include: { transactions: true },
        },
        _count: { select: { payments: true } },
      },
    }),
    prisma.lease.count({ where }),
  ]);

  res.json({
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getLease = byId(prisma.lease, {
  apartment: true,
  tenant: true,
  payments: {
    orderBy: { dueDate: 'asc' },
    include: { transactions: true },
  },
});

export const createLease = create(prisma.lease);
export const updateLease = update(prisma.lease);
export const deleteLease = remove(prisma.lease);
