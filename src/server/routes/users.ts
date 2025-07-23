import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/users
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { department, role, page = 1, limit = 20 } = req.query;
  
  logger.info('Users list requested', { department, role, page, limit });

  // TODO: Get actual users from database
  const users = [
    {
      id: '1',
      email: 'john.doe@company.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin',
      department: 'IT',
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date('2024-03-15')
    }
  ];

  res.json({
    success: true,
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: users.length,
      totalPages: Math.ceil(users.length / Number(limit))
    }
  });
}));

export default router;