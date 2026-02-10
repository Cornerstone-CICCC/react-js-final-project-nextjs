import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireMembership } from '../middleware/membership';
import { USER_SELECT } from '../utils/prisma-selects';

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/todos/:studyId
 * Get all todos for a study
 */
router.get('/:studyId', requireMembership, async (req: Request, res: Response) => {
  try {
    const studyId = req.params.studyId as string;

    const todos = await prisma.todo.findMany({
      where: { studyId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ todos });
  } catch (error: unknown) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Failed to get todos' });
  }
});

/**
 * POST /api/todos/:studyId
 * Create a new todo
 */
router.post('/:studyId', requireMembership, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const studyId = req.params.studyId as string;
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Todo title is required' });
    }

    const todo = await prisma.todo.create({
      data: { studyId, userId, title: title.trim() },
      include: { user: { select: USER_SELECT } },
    });

    res.status(201).json({ todo });
  } catch (error: unknown) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

/**
 * PATCH /api/todos/:todoId
 * Update a todo (title or completed status)
 */
router.patch('/:todoId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const todoId = req.params.todoId as string;
    const { title, completed } = req.body;

    const todo = await prisma.todo.findUnique({ where: { id: todoId } });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (todo.userId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own todos' });
    }

    const updateData: { title?: string; completed?: boolean } = {};
    if (title !== undefined) updateData.title = title.trim();
    if (completed !== undefined) updateData.completed = completed;

    const updatedTodo = await prisma.todo.update({
      where: { id: todoId },
      data: updateData,
      include: { user: { select: USER_SELECT } },
    });

    res.json({ todo: updatedTodo });
  } catch (error: unknown) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

/**
 * DELETE /api/todos/:todoId
 * Delete a todo
 */
router.delete('/:todoId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const todoId = req.params.todoId as string;

    const todo = await prisma.todo.findUnique({ where: { id: todoId } });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (todo.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own todos' });
    }

    await prisma.todo.delete({ where: { id: todoId } });

    res.json({ message: 'Todo deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;
