import type { ProjectTask, CompanyContact } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { UpdateTaskStatus } from './update-task-status';
import { AddTaskDialog } from './add-task-dialog';

const formatDate = (dateString: string | null) => {
    if (!dateString) return '–';
    try {
        return format(new Date(`${dateString}T00:00:00`), 'MMM d, yyyy');
    } catch (error) {
        return 'Invalid Date';
    }
};

export default function TasksCard({ tasks, contacts, projectId }: { tasks: ProjectTask[], contacts: CompanyContact[], projectId: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
            <ListTodo className="h-6 w-6 text-muted-foreground" />
            <div>
                <CardTitle>Project Tasks</CardTitle>
                <CardDescription>All tasks associated with this project.</CardDescription>
            </div>
        </div>
        <AddTaskDialog contacts={contacts} projectId={projectId} />
      </CardHeader>
      <CardContent>
        {tasks && tasks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <span className="font-semibold">{task.title}</span>
                        {task.description && <span className="text-xs text-muted-foreground">{task.description}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{task.assignee?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  <TableCell>{formatDate(task.dueDate)}</TableCell>
                  <TableCell>
                    <UpdateTaskStatus task={task} projectId={projectId} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No tasks have been created for this project yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
