import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireMembership } from '../middleware/membership';
import { generateInviteCode } from '../utils/inviteCode';
import { getCurrentWeekNumber } from '../utils/week';
import { MEMBERS_INCLUDE } from '../utils/prisma-selects';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/studies
 * Get all studies for current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const studies = await prisma.study.findMany({
      where: { members: { some: { userId } } },
      include: {
        ...MEMBERS_INCLUDE,
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { todos: true, messages: true, schedules: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ studies });
  } catch (error: unknown) {
    console.error('Get studies error:', error);
    res.status(500).json({ error: 'Failed to get studies' });
  }
});

/**
 * POST /api/studies
 * Create a new study
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Study name is required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Study name must be less than 100 characters' });
    }

    const currentWeek = getCurrentWeekNumber();

    let inviteCode = generateInviteCode();
    while (await prisma.study.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    const study = await prisma.study.create({
      data: {
        name: name.trim(),
        inviteCode,
        currentWeek,
        createdById: userId,
        members: { create: { userId, role: 'owner' } },
      },
      include: MEMBERS_INCLUDE,
    });

    res.status(201).json({ study });
  } catch (error: unknown) {
    console.error('Create study error:', error);
    res.status(500).json({ error: 'Failed to create study' });
  }
});

/**
 * GET /api/studies/:studyId
 * Get study details
 */
router.get('/:studyId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const studyId = req.params.studyId as string;

    const study = await prisma.study.findFirst({
      where: { id: studyId, members: { some: { userId } } },
      include: {
        ...MEMBERS_INCLUDE,
        todos: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        schedules: {
          include: {
            attendances: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
          orderBy: { date: 'asc' },
        },
        messages: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    if (!study) {
      return res.status(404).json({ error: 'Study not found or access denied' });
    }

    res.json({ study });
  } catch (error: unknown) {
    console.error('Get study error:', error);
    res.status(500).json({ error: 'Failed to get study' });
  }
});

/**
 * PATCH /api/studies/:studyId
 * Update study (goal, name, etc.)
 */
router.patch('/:studyId', requireMembership, async (req: Request, res: Response) => {
  try {
    const studyId = req.params.studyId as string;
    const { currentGoal, name } = req.body;

    const updateData: { currentGoal?: string; name?: string } = {};
    if (currentGoal !== undefined) updateData.currentGoal = currentGoal;
    if (name !== undefined) {
      if (name.trim().length === 0) {
        return res.status(400).json({ error: 'Study name cannot be empty' });
      }
      updateData.name = name.trim();
    }

    const study = await prisma.study.update({
      where: { id: studyId },
      data: updateData,
    });

    res.json({ study });
  } catch (error: unknown) {
    console.error('Update study error:', error);
    res.status(500).json({ error: 'Failed to update study' });
  }
});

/**
 * POST /api/studies/join
 * Join a study using invite code
 */
router.post('/join', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const study = await prisma.study.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: { members: { where: { userId } } },
    });

    if (!study) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (study.members.length > 0) {
      return res.status(409).json({ error: 'You are already a member of this study' });
    }

    await prisma.studyMember.create({
      data: { studyId: study.id, userId, role: 'member' },
    });

    const updatedStudy = await prisma.study.findUnique({
      where: { id: study.id },
      include: MEMBERS_INCLUDE,
    });

    res.json({ study: updatedStudy });
  } catch (error: unknown) {
    console.error('Join study error:', error);
    res.status(500).json({ error: 'Failed to join study' });
  }
});

/**
 * GET /api/studies/:studyId/progress
 * Get study progress (todo completion percentage)
 */
router.get('/:studyId/progress', requireMembership, async (req: Request, res: Response) => {
  try {
    const studyId = req.params.studyId as string;

    const todos = await prisma.todo.findMany({ where: { studyId } });

    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    res.json({ total, completed, progress });
  } catch (error: unknown) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

export default router;
