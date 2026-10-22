export interface DeadlineStatus {
  daysRemaining: number;
  isUrgent: boolean;
  isExpired: boolean;
  isClosingToday: boolean;
  isClosingTomorrow: boolean;
  formattedDateEn: string;
  formattedDateMr: string;
  badgeLabelEn: string;
  badgeLabelMr: string;
  badgeColor: "emerald" | "amber" | "rose" | "slate";
}

/**
 * Calculates deadline metrics based on target date string (YYYY-MM-DD or ISO string).
 * Reference date defaults to current time.
 */
export function calculateDeadlineStatus(
  deadlineDateStr: string,
  referenceDate: Date = new Date()
): DeadlineStatus {
  const deadline = new Date(deadlineDateStr);
  // Normalize both dates to midnight local time for fair day diff calculation
  const targetMidnight = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  const refMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  const diffTime = targetMidnight.getTime() - refMidnight.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = daysRemaining < 0;
  const isClosingToday = daysRemaining === 0;
  const isClosingTomorrow = daysRemaining === 1;
  const isUrgent = !isExpired && daysRemaining <= 7;

  // Format date nicely
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const formattedDateEn = deadline.toLocaleDateString("en-IN", options);
  const formattedDateMr = deadline.toLocaleDateString("mr-IN", options);

  let badgeLabelEn = `${daysRemaining} days left`;
  let badgeLabelMr = `${daysRemaining} दिवस शिल्लक`;
  let badgeColor: "emerald" | "amber" | "rose" | "slate" = "emerald";

  if (isExpired) {
    badgeLabelEn = "Deadline passed";
    badgeLabelMr = "मुदत संपली";
    badgeColor = "slate";
  } else if (isClosingToday) {
    badgeLabelEn = "Closing today!";
    badgeLabelMr = "आज शेवटचा दिवस!";
    badgeColor = "rose";
  } else if (isClosingTomorrow) {
    badgeLabelEn = "Closes tomorrow!";
    badgeLabelMr = "उद्या मुदत संपत आहे!";
    badgeColor = "rose";
  } else if (isUrgent) {
    badgeLabelEn = `${daysRemaining} days left (Urgent)`;
    badgeLabelMr = `${daysRemaining} दिवस शिल्लक (तातडीने)`;
    badgeColor = "amber";
  }

  return {
    daysRemaining,
    isUrgent,
    isExpired,
    isClosingToday,
    isClosingTomorrow,
    formattedDateEn,
    formattedDateMr,
    badgeLabelEn,
    badgeLabelMr,
    badgeColor,
  };
}
