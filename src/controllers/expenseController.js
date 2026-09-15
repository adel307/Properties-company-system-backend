import prisma from '../db.js';
import { asyncHandler, byId, create, pagination } from './crud.js';

export const listExpenses = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    skip,
    date,
    orderByDate,
  } = pagination(req.query);

  const where = date
    ? { expenseDate: new Date(date) }
    : {};

  const orderBy = orderByDate
    ? { expenseDate: 'desc' }
    : { id: 'asc' };

  const [data, total] = await prisma.$transaction([
    prisma.dailyExpense.findMany({
      where,
      include: {
        category: true,
      },
      orderBy,
      skip,
      take: limit,
    }),

    prisma.dailyExpense.count({
      where,
    }),
  ]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getExpense = byId(
  prisma.dailyExpense,
  { category: true }
);

export const createExpense = create(
  prisma.dailyExpense
);

export const getExpensesByDate = asyncHandler(
  async (req, res) => {
    res.json({
      data: await prisma.dailyExpense.findMany({
        where: {
          expenseDate: new Date(req.params.date),
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    });
  }
);