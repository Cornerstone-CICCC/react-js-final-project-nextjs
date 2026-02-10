import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireMembership } from '../middleware/membership';
import { getCurrentWeekNumber, getWeekDateRange } from '../utils/week';
import { USER_SELECT } from '../utils/prisma-selects';

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/history/:studyId
 * Get all weekly history for a study
 */
router.get('/:studyId', requireMembership, async (req: Request, res: Response) => {
  try {
    const studyId = req.params.studyId as string;

    const history = await prisma.weeklyHistory.findMany({
      where: { studyId },
      include: {
        todos: { include: { user: { select: USER_SELECT } } },
      },
      orderBy: { weekNumber: 'desc' },
    });

    res.json({ history });
  } catch (error: unknown) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

/**
 * POST /api/history/:studyId/archive
 * Archive current week (move todos to history, reset goal and todos)
 */
router.post('/:studyId/archive', requireMembership, async (req: Request, res: Response) => {
  try {
    const studyId = req.params.studyId as string;

    const study = await prisma.study.findUnique({
      where: { id: studyId },
      include: { todos: true },
    });

    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    const hasGoal = study.currentGoal.trim().length > 0;
    const hasTodos = study.todos.length > 0;

    if (!hasGoal && !hasTodos) {
      return res.status(400).json({ error: 'Nothing to archive for current week' });
    }

    const archiveWeekNumber = Math.max(1, study.currentWeek || getCurrentWeekNumber());
    const { weekStart, weekEnd } = getWeekDateRange(archiveWeekNumber);
    const nextWeekNumber = Math.max(getCurrentWeekNumber(), archiveWeekNumber + 1);

    const history = await prisma.$transaction(async (tx) => {
      const createdHistory = await tx.weeklyHistory.create({
        data: {
          studyId,
          weekNumber: archiveWeekNumber,
          weekStart,
          weekEnd,
          goal: study.currentGoal,
          todos: {
            create: study.todos.map((todo) => ({
              userId: todo.userId,
              title: todo.title,
              completed: todo.completed,
            })),
          },
        },
        include: {
          todos: { include: { user: { select: USER_SELECT } } },
        },
      });

      await tx.todo.deleteMany({ where: { studyId } });

      await tx.study.update({
        where: { id: studyId },
        data: { currentGoal: '', currentWeek: nextWeekNumber },
      });

      return createdHistory;
    });

    res.status(201).json({ history });
  } catch (error: unknown) {
    console.error('Archive week error:', error);
    res.status(500).json({ error: 'Failed to archive week' });
  }
});

/**
 * DELETE /api/history/:historyId
 * Delete a history entry
 */
router.delete('/:historyId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const historyId = req.params.historyId as string;

    const history = await prisma.weeklyHistory.findUnique({
      where: { id: historyId },
      include: { study: { include: { members: true } } },
    });

    if (!history) {
      return res.status(404).json({ error: 'History not found' });
    }

    if (!history.study.members.some((m) => m.userId === userId)) {
      return res.status(403).json({ error: 'Not a member of this study' });
    }

    await prisma.weeklyHistory.delete({ where: { id: historyId } });

    res.json({ message: 'History deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete history error:', error);
    res.status(500).json({ error: 'Failed to delete history' });
  }
});

export default router;
