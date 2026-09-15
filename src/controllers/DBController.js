import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ShowAllTables = async (_req, res) => {
  try {
    // 1. PostgreSQL استعلام لقواعد بيانات
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    res.status(200).json({
      success: true,
      data: tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tables',
      error: error.message
    });
  }
};