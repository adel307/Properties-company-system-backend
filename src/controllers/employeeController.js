import prisma from '../db.js';
import { asyncHandler, byId, create, pagination, remove, update } from './crud.js';

const sortable = new Set(['name', 'salary', 'experienceYears', 'age', 'updatedAt']);
export const listEmployees = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const search = req.query.search?.trim();
  const orderBy = sortable.has(req.query.sort_by) ? { [req.query.sort_by]: 'asc' } : { name: 'asc' };
  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
  const [data, total] = await prisma.$transaction([
    prisma.employee.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { properties: { include: { property: true } } },
    }),
    prisma.employee.count({ where }),
  ]);
  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
export const getEmployee = byId(prisma.employee, { properties: { include: { property: true } } });
export const createEmployee = create(prisma.employee);
export const updateEmployee = update(prisma.employee);
export const deleteEmployee = remove(prisma.employee);

// KEEP