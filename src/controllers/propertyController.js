import prisma from '../db.js';
import { asyncHandler, byId, create, pagination, remove, update } from './crud.js';

const sortable = new Set(['name', 'startedIn', 'endedIn', 'floorsNumber', 'area']);
export const listProperties = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const q = req.query;
  const where = {
    ...(q.status && { status: q.status }), ...(q.search && { name: { contains: q.search, mode: 'insensitive' } }),
    ...((q.min_area || q.max_area) && { area: { ...(q.min_area && { gte: q.min_area }), ...(q.max_area && { lte: q.max_area }) } }),
    ...(q.started_after && { startedIn: { gte: new Date(q.started_after) } }), ...(q.ended_before && { endedIn: { lte: new Date(q.ended_before) } }),
  };
  const orderBy = sortable.has(q.sort_by) ? { [q.sort_by]: 'asc' } : { name: 'asc' };
  const [data, total] = await prisma.$transaction([prisma.property.findMany({ where, orderBy, include: { _count: { select: { apartments: true } } }, skip, take: limit }), prisma.property.count({ where })]);
  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
export const getProperty = byId(prisma.property, { apartments: true, employees: { include: { employee: true } }, _count: { select: { apartments: true } } });
export const getPropertyEmployees = asyncHandler(async (req, res) => res.json({ data: await prisma.propertyEmployee.findMany({ where: { propertyId: req.params.id }, include: { employee: true } }) }));
export const createProperty = create(prisma.property);
export const updateProperty = update(prisma.property);
export const deleteProperty = remove(prisma.property);
