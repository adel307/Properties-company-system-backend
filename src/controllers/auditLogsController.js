import prisma from '../db.js';
import { byId, create, paginated, remove, update } from './crud.js';
export const listAuditLogs = paginated(prisma.AuditLog,{
  orderBy: { createdAt: 'desc' },
});
export const getAuditLog = byId(prisma.AuditLog);
export const createAuditLog = create(prisma.AuditLog);
export const updateAuditLog = update(prisma.AuditLog);
export const deleteAuditLog = remove(prisma.AuditLog);