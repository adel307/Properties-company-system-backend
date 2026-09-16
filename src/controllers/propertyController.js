import prisma from '../db.js';
import { asyncHandler, byId, create, pagination, remove } from './crud.js';

const sortable = new Set(['name', 'startedIn', 'endedIn', 'floorsNumber', 'area']);

export const listProperties = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const q = req.query;

  const minArea = q.min_area ? Number(q.min_area) : undefined;
  const maxArea = q.max_area ? Number(q.max_area) : undefined;

  const where = {
    ...(q.status && { status: q.status }),
    ...(q.search && { name: { contains: q.search, mode: 'insensitive' } }),
    ...((minArea !== undefined || maxArea !== undefined) && {
      area: {
        ...(minArea !== undefined && { gte: minArea }),
        ...(maxArea !== undefined && { lte: maxArea }),
      },
    }),
    ...(q.started_after && { startedIn: { gte: new Date(q.started_after) } }),
    ...(q.ended_before && { endedIn: { lte: new Date(q.ended_before) } }),
  };

  const orderBy = sortable.has(q.sort_by) ? { [q.sort_by]: 'asc' } : { name: 'asc' };

  const [data, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      orderBy,
      include: { _count: { select: { apartments: true } } },
      skip,
      take: limit,
    }),
    prisma.property.count({ where }),
  ]);

  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getProperty = byId(prisma.property, { apartments: true, employees: { include: { employee: true } }, _count: { select: { apartments: true } } });
export const getPropertyEmployees = asyncHandler(async (req, res) => res.json({ data: await prisma.propertyEmployee.findMany({ where: { propertyId: req.params.id }, include: { employee: true } }) }));
export const createProperty = create(prisma.property);

const propertyFields = ['name', 'status', 'address', 'startedIn', 'endedIn', 'floorsNumber', 'area'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRelationIds(value, field) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => !item || typeof item.id !== 'string' || !uuid.test(item.id))) {
    const error = new Error(`${field} must be an array of objects containing valid ids`);
    error.status = 400;
    throw error;
  }

  return [...new Set(value.map((item) => item.id))];
}

export const updateProperty = asyncHandler(async (req, res) => {
  const apartmentIds = getRelationIds(req.body.apartments, 'apartments');
  const employeeIds = getRelationIds(req.body.employees, 'employees');
  const data = Object.fromEntries(
    propertyFields
      .filter((field) => req.body[field] !== undefined)
      .map((field) => [field, req.body[field]])
  );

  if (data.startedIn) data.startedIn = new Date(data.startedIn);
  if (data.endedIn) data.endedIn = new Date(data.endedIn);
  if (data.floorsNumber !== undefined) data.floorsNumber = Number(data.floorsNumber);
  if (data.area !== undefined) data.area = Number(data.area);

  const property = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.property.findUnique({
      where: { id: req.params.id },
      include: { employees: true },
    });

    if (!existing) return null;

    if (apartmentIds !== undefined && apartmentIds.length > 0) {
      const apartments = await transaction.apartment.findMany({
        where: { id: { in: apartmentIds } },
        select: { id: true },
      });
      if (apartments.length !== apartmentIds.length) {
        const error = new Error('One or more apartment ids were not found');
        error.status = 400;
        throw error;
      }

      await transaction.apartment.updateMany({
        where: { id: { in: apartmentIds } },
        data: { propertyId: req.params.id },
      });
    }

    if (employeeIds !== undefined) {
      const existingRoles = new Map(existing.employees.map((item) => [item.employeeId, item.role]));
      const employees = employeeIds.length > 0
        ? await transaction.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true } })
        : [];

      if (employees.length !== employeeIds.length) {
        const error = new Error('One or more employee ids were not found');
        error.status = 400;
        throw error;
      }

      await transaction.propertyEmployee.deleteMany({ where: { propertyId: req.params.id } });
      if (employeeIds.length > 0) {
        await transaction.propertyEmployee.createMany({
          data: employeeIds.map((employeeId) => ({
            propertyId: req.params.id,
            employeeId,
            role: existingRoles.get(employeeId) || 'Assigned',
          })),
        });
      }
    }

    return transaction.property.update({
      where: { id: req.params.id },
      data,
      include: { apartments: true, employees: { include: { employee: true } } },
    });
  });

  if (!property) return res.status(404).json({ error: 'Not found' });
  return res.json({ data: property });
});

export const deleteProperty = remove(prisma.property);