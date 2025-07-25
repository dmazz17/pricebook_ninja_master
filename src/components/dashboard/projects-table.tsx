import type { Project } from '@/lib/data';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Briefcase } from 'lucide-react';

function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function getStatusVariant(status: string): BadgeProps['variant'] {
    switch (status?.toLowerCase()) {
        case 'completed':
            return 'success';
        case 'in progress':
            return 'info';
        case 'on hold':
            return 'warning';
        case 'planning':
            return 'secondary';
        default:
            return 'secondary';
    }
}

function getPriorityVariant(priority: string): BadgeProps['variant'] {
    switch (priority?.toLowerCase()) {
        case 'high':
            return 'destructive';
        case 'medium':
            return 'warning';
        case 'low':
            return 'info';
        default:
            return 'secondary';
    }
}


export default function ProjectsTable({ projects, userId }: { projects: Project[], userId: string }) {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription>An overview of your recent and ongoing projects. Click a project name to view details.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Target Date</TableHead>
              <TableHead className="text-right">Hours Usage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {projects.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No projects found.
                    </TableCell>
                </TableRow>
             ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                        <div className="flex flex-col">
                            <Link href={`/dashboard/project/${project.id}`} className="font-semibold text-primary hover:underline">
                                {project.name}
                            </Link>
                            <div className="flex flex-wrap gap-1 mt-1">
                            {project.tags?.map(tag => (
                                <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                            ))}
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(project.priority)}>
                        {project.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(project.startDate)}</TableCell>
                    <TableCell>{formatDate(project.endDate)}</TableCell>
                    <TableCell className="text-right">
                      {(project.purchasedHours && project.purchasedHours > 0) ? (
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-xs text-muted-foreground">
                            {project.hoursLogged?.toFixed(2) ?? '0.00'} / {project.purchasedHours.toFixed(2)} hrs
                           </span>
                           <Progress
                            value={((project.hoursLogged ?? 0) / project.purchasedHours) * 100}
                            className="h-2 w-24"
                           />
                        </div>
                      ) : (
                        <span>{project.hoursLogged?.toFixed(2) ?? '0.00'} hrs</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
