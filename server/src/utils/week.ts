const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

export function getCurrentWeekNumber(date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  return Math.floor(diff / MS_PER_WEEK) + 1;
}

export function getWeekDateRange(
  weekNumber: number,
  year = new Date().getFullYear(),
): { weekStart: string; weekEnd: string } {
  const normalizedWeek = Number.isFinite(weekNumber)
    ? Math.max(1, Math.floor(weekNumber))
    : 1;
  const startOfYear = new Date(year, 0, 1);
  const weekStartDate = new Date(
    startOfYear.getTime() + (normalizedWeek - 1) * MS_PER_WEEK,
  );
  const weekEndDate = new Date(weekStartDate.getTime() + 6 * MS_PER_DAY);

  return {
    weekStart: formatISODate(weekStartDate),
    weekEnd: formatISODate(weekEndDate),
  };
}

function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
