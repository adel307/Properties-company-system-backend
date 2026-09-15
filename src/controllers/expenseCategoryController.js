import prisma from '../db.js';
import { byId, create, paginated, remove, update } from './crud.js';
export const listExpenseCategories = paginated(prisma.expenseCategory);
export const getExpenseCategory = byId(prisma.expenseCategory);
export const createExpenseCategory = create(prisma.expenseCategory);
export const updateExpenseCategory = update(prisma.expenseCategory);
export const deleteExpenseCategory = remove(prisma.expenseCategory);
