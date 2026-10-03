export type Milestone = {
  id: string;
  title: string;
  date: string;
};

export type ApplicationTimelineEvent<T extends { id: string; deadline: string }> =
  {
    type: "application";
    id: string;
    date: string;
    application: T;
  };

export type MilestoneTimelineEvent = {
  type: "milestone";
  id: string;
  date: string;
  title: string;
};

export type TimelineEvent<T extends { id: string; deadline: string }> =
  | ApplicationTimelineEvent<T>
  | MilestoneTimelineEvent;

export function eventTime(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function hasChronologicalDate(date: string) {
  return eventTime(date) !== null;
}

/** One chronological stream. Applications and milestones are peer events. */
export function buildTimelineEvents<T extends { id: string; deadline: string }>(
  applications: T[],
  milestones: Milestone[],
): TimelineEvent<T>[] {
  const applicationEvents: TimelineEvent<T>[] = applications
    .filter((app) => hasChronologicalDate(app.deadline))
    .map((app) => ({
      type: "application" as const,
      id: `application:${app.id}`,
      date: app.deadline,
      application: app,
    }));

  const milestoneEvents: TimelineEvent<T>[] = milestones
    .filter((milestone) => hasChronologicalDate(milestone.date))
    .map((milestone) => ({
      type: "milestone" as const,
      id: `milestone:${milestone.id}`,
      date: milestone.date,
      title: milestone.title,
    }));

  return [...applicationEvents, ...milestoneEvents].sort((a, b) => {
    const timeA = eventTime(a.date) ?? 0;
    const timeB = eventTime(b.date) ?? 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });
}
