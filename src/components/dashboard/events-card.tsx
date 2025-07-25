import type { ProjectEvent } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Calendar, Phone, ListChecks, MessageSquare } from 'lucide-react';

function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

const eventIcons: Record<string, React.ElementType> = {
    activity: Activity,
    meeting: Calendar,
    call: Phone,
    comment: MessageSquare,
    default: ListChecks,
};

function getEventIcon(eventType: string) {
    const eventTypeLower = eventType?.toLowerCase() ?? 'default';
    const Icon = eventIcons[eventTypeLower] || eventIcons.default;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
}

export default function EventsCard({ events }: { events: ProjectEvent[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>A log of recent events and comments across your projects.</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  {getEventIcon(event.eventType)}
                </div>
                <div className="grid flex-1 gap-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">{event.projectName}</span>
                    {event.description && ` - ${event.description}`}
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(event.eventDate)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No recent activity to display.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
