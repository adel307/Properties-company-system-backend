import prisma from '../db.js';
import { byId, create, paginated, remove, update } from './crud.js';
export const listApartments = paginated(prisma.apartment, { include: { property: true }, orderBy: { floor: 'asc' } });
export const getApartment = byId(prisma.apartment, { property: true });
export const createApartment = create(prisma.apartment);
export const updateApartment = update(prisma.apartment);
export const deleteApartment = remove(prisma.apartment);
