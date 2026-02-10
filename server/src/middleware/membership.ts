import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

/**
 * Middleware that verifies the authenticated user is a member of the study
 * specified by :studyId in the route params.
 *
 * Must be used AFTER authenticateToken middleware.
 * Attaches membership info to req.membership.
 */
export async function requireMembership(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.user!.userId;
  const studyId = req.params.studyId as string;

  if (!studyId) {
    res.status(400).json({ error: 'Study ID is required' });
    return;
  }

  const membership = await prisma.studyMember.findFirst({
    where: { studyId, userId },
  });

  if (!membership) {
    res.status(403).json({ error: 'Not a member of this study' });
    return;
  }

  next();
}
