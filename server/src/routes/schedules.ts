import express, { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireMembership } from '../middleware/membership';
import { USER_SELECT, SCHEDULE_INCLUDE } from '../utils/prisma-selects';

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/schedules/:studyId
 * Get all schedules for a study
 */
router.get('/:studyId', requireMembership, async (req: Request, res: Response) => {
  try {
    const studyId = req.params.studyId as string;

    const schedules = await prisma.schedule.findMany({
      where: { studyId },
      include: SCHEDULE_INCLUDE,
      orderBy: { date: 'asc' },
    });

    res.json({ schedules });
  } catch (error: unknown) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Failed to get schedules' });
  }
});

/**
 * POST /api/schedules/:studyId
 * Create a new schedule
 */
router.post('/:studyId', requireMembership, async (req: Request, res: Response) => {
  try {
    const studyId = req.params.studyId as string;
    const { title, date, time, location } = req.body;

    if (!title || !date || !time || !location) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const members = await prisma.studyMember.findMany({ where: { studyId } });

    const schedule = await prisma.schedule.create({
      data: {
        studyId,
        title: title.trim(),
        date,
        time,
        location: location.trim(),
        attendances: {
          create: members.map((member) => ({
            userId: member.userId,
            status: 'pending',
          })),
        },
      },
      include: SCHEDULE_INCLUDE,
    });

    res.status(201).json({ schedule });
  } catch (error: unknown) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

/**
 * PATCH /api/schedules/:scheduleId
 * Update a schedule
 */
router.patch('/:scheduleId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const scheduleId = req.params.scheduleId as string;
    const { title, date, time, location } = req.body;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { study: { include: { members: true } } },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (!schedule.study.members.some((m: { userId: string }) => m.userId === userId)) {
      return res.status(403).json({ error: 'Not a member of this study' });
    }

    const updateData: { title?: string; date?: string; time?: string; location?: string } = {};
    if (title !== undefined) updateData.title = title.trim();
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (location !== undefined) updateData.location = location.trim();

    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: SCHEDULE_INCLUDE,
    });

    res.json({ schedule: updatedSchedule });
  } catch (error: unknown) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

/**
 * DELETE /api/schedules/:scheduleId
 * Delete a schedule
 */
router.delete('/:scheduleId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const scheduleId = req.params.scheduleId as string;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { study: { include: { members: true } } },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (!schedule.study.members.some((m: { userId: string }) => m.userId === userId)) {
      return res.status(403).json({ error: 'Not a member of this study' });
    }

    await prisma.schedule.delete({ where: { id: scheduleId } });

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

/**
 * PATCH /api/schedules/:scheduleId/attendance
 * Update attendance status
 */
router.patch('/:scheduleId/attendance', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const scheduleId = req.params.scheduleId as string;
    const { status } = req.body;

    if (!['attending', 'not-attending', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const attendance = await prisma.attendance.findFirst({
      where: { scheduleId, userId },
    });

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { status },
      include: { user: { select: USER_SELECT } },
    });

    res.json({ attendance: updatedAttendance });
  } catch (error: unknown) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

export default router;
