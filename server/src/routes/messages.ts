import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireMembership } from '../middleware/membership';
import { USER_SELECT } from '../utils/prisma-selects';

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/messages/:studyId
 * Get all messages for a study
 */
router.get('/:studyId', requireMembership, async (req: Request, res: Response) => {
  try {
    const studyId = req.params.studyId as string;
    const { limit = '100', offset = '0' } = req.query;

    const messages = await prisma.message.findMany({
      where: { studyId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({ messages });
  } catch (error: unknown) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * POST /api/messages/:studyId
 * Send a new message
 */
router.post('/:studyId', requireMembership, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const studyId = req.params.studyId as string;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await prisma.message.create({
      data: { studyId, userId, content: content.trim() },
      include: { user: { select: USER_SELECT } },
    });

    res.status(201).json({ message });
  } catch (error: unknown) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
