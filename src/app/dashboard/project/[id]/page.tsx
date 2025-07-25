import Link from 'next/link';
import { getProjectDetails } from '@/lib/data';
import { redirect } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { currentUser } from '@clerk/nextjs/server';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { AddCommentForm } from '@/components/dashboard/project/add-comment-form';
import TimeBlocksCard from '@/components/dashboard/project/time-blocks-card';
import TasksCard from '@/components/dashboard/project/tasks-card';

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMMM d, yyyy');
}

const formatRelativeDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

const getStatusVariant = (status: string): BadgeProps['variant'] => {
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
};

const getPriorityVariant = (priority: string): BadgeProps['variant'] => {
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
};

export default async function ProjectDetailsPage({
  params
}: {
  params: { id: string };
}) {
  const projectId = params.id;
  const user = await currentUser();
  const userId = user?.id;

  if (!projectId || !userId) {
    redirect('/dashboard');
  }

  const project = await getProjectDetails(projectId);

  if (!project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Button asChild>
          <Link href="/dashboard">Go Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">Project Details</p>
        </div>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span>Status</span> <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge></div>
              <div className="flex justify-between"><span>Priority</span> <Badge variant={getPriorityVariant(project.priority)}>{project.priority}</Badge></div>
              <div className="flex justify-between"><span>Start Date</span> <span>{formatDate(project.startDate)}</span></div>
              <div className="flex justify-between"><span>Target Date</span> <span>{formatDate(project.endDate)}</span></div>
               {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {project.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
               )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <MessageSquare className="h-6 w-6" />
                  <div>
                    <CardTitle>Comments</CardTitle>
                    <CardDescription>Discussion and updates about this project.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <AddCommentForm projectId={projectId} userId={userId} />
                    <div className="space-y-6">
                        {project.comments.length > 0 ? (
                            project.comments.map(comment => (
                                <div key={comment.id} className="flex gap-4">
                                    <Avatar>
                                        <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} data-ai-hint="person portrait" />
                                        <AvatarFallback>{comment.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 rounded-lg border bg-card p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-semibold">{comment.author.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatRelativeDate(comment.createdAt)}</p>
                                        </div>
                                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No comments yet. Be the first to add one!
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            <TasksCard tasks={project.tasks} contacts={project.contacts} projectId={project.id} />
            <TimeBlocksCard timeBlocks={project.timeBlocks} />
        </div>
      </div>
    </div>
  );
}
