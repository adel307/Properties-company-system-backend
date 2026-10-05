import prisma from '../db.js';
import { asyncHandler, byId, create, pagination, remove, update } from './crud.js';

const sortable = new Set(['name', 'phone', 'email', 'createdAt', 'updatedAt']);

export const listTenants = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const search = req.query.search?.trim();
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { nationalId: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const orderBy = sortable.has(req.query.sort_by)
    ? { [req.query.sort_by]: 'asc' }
    : { name: 'asc' };

  const [data, total] = await prisma.$transaction([
    prisma.tenant.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { _count: { select: { leases: true } } },
    }),
    prisma.tenant.count({ where }),
  ]);

  res.json({
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getTenant = byId(prisma.tenant, {
  leases: true,
  _count: { select: { leases: true } },
});

export const createTenant = create(prisma.tenant);
export const updateTenant = update(prisma.tenant);
export const deleteTenant = remove(prisma.tenant);
