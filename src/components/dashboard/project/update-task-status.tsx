'use client';

import { useTransition } from 'react';
import type { ProjectTask, TaskStatus } from '@/lib/data';
import { updateTaskStatus } from '@/app/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusOptions: TaskStatus[] = ['To Do', 'In Progress', 'Done', 'Backlog'];

export function UpdateTaskStatus({ task, projectId }: { task: ProjectTask; projectId: string }) {
  const [isPending, startTransition] = useTransition();

  const onStatusChange = (newStatus: TaskStatus) => {
    const formData = new FormData();
    formData.append('status', newStatus);
    formData.append('taskId', task.id);
    formData.append('projectId', projectId);

    startTransition(() => {
        updateTaskStatus(formData);
    });
  };

  return (
    <Select
      defaultValue={task.status}
      onValueChange={(value: TaskStatus) => onStatusChange(value)}
      disabled={isPending}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Set status" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map(status => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
