import type { ProjectTimeBlock } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        // Appending T00:00:00 ensures the date is parsed in local time, avoiding timezone shifts.
        return format(new Date(`${dateString}T00:00:00`), 'MMM d, yyyy');
    } catch (error) {
        return 'Invalid Date';
    }
};

export default function TimeBlocksCard({ timeBlocks }: { timeBlocks: ProjectTimeBlock[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Clock className="h-6 w-6 text-muted-foreground" />
        <div>
            <CardTitle>Time Blocks</CardTitle>
            <CardDescription>Logged time for this project.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {timeBlocks && timeBlocks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeBlocks.map((block) => (
                <TableRow key={block.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(block.date)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{block.duration}</TableCell>
                  <TableCell>{block.description || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No time blocks have been logged for this project yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
