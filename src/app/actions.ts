
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addComment as addCommentToDb, updateTaskStatus as updateTaskStatusInDb, createTask } from '@/lib/data';

const AddCommentSchema = z.object({
  content: z.string().min(1, {
    message: 'Comment cannot be empty.',
  }),
  projectId: z.string(),
  userId: z.string().nullable(),
});

export type AddCommentState = {
  errors?: {
    content?: string[];
  };
  message?: string | null;
  success?: boolean;
};

export async function addComment(prevState: AddCommentState, formData: FormData) {
  const validatedFields = AddCommentSchema.safeParse({
    content: formData.get('content'),
    projectId: formData.get('projectId'),
    userId: formData.get('userId') || null,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to add comment. Please check your input.',
      success: false,
    };
  }
  
  const { content, projectId, userId } = validatedFields.data;

  try {
    await addCommentToDb(projectId, userId, content);
  } catch (error) {
    return {
      errors: {},
      message: 'Database Error: Failed to add comment.',
      success: false,
    };
  }
  
  revalidatePath(`/dashboard/project/${projectId}`);
  return {
    errors: {},
    message: 'Comment added successfully.',
    success: true,
  };
}


// --- Task Actions ---

const UpdateTaskStatusSchema = z.object({
  status: z.enum(['To Do', 'In Progress', 'Done', 'Backlog']),
  taskId: z.string(),
  projectId: z.string(),
});

export async function updateTaskStatus(formData: FormData) {
  const validatedFields = UpdateTaskStatusSchema.safeParse({
    status: formData.get('status'),
    taskId: formData.get('taskId'),
    projectId: formData.get('projectId'),
  });

  if (!validatedFields.success) {
    console.error('Validation failed for updating task status:', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Failed to update task status.',
    };
  }

  const { taskId, status, projectId } = validatedFields.data;
  
  try {
    await updateTaskStatusInDb(taskId, status);
  } catch(e) {
    return {
      message: 'Database error: failed to update task status'
    }
  }
  
  revalidatePath(`/dashboard/project/${projectId}`);
  return {
    message: 'Task status updated.'
  }
}

const AddTaskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  status: z.enum(['To Do', 'In Progress', 'Done', 'Backlog']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

export type AddTaskState = {
    errors?: {
        title?: string[];
        description?: string[];
        status?: string[];
        assigneeId?: string[];
        dueDate?: string[];
    };
    message?: string | null;
    success?: boolean;
}

export async function addTask(prevState: AddTaskState, formData: FormData) {
    const assigneeIdValue = formData.get('assigneeId');

    const validatedFields = AddTaskSchema.safeParse({
        projectId: formData.get('projectId'),
        title: formData.get('title'),
        description: formData.get('description'),
        status: formData.get('status'),
        assigneeId: (assigneeIdValue === 'unassigned' || !assigneeIdValue) ? undefined : assigneeIdValue as string,
        dueDate: formData.get('dueDate') || undefined,
    });
    
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to create task.',
            success: false,
        }
    }

    const { projectId, title, description, status, assigneeId, dueDate } = validatedFields.data;

    try {
        await createTask({ projectId, title, description, status, userId: assigneeId, dueDate });
    } catch (e) {
        return {
            errors: {},
            message: 'Database error: failed to create task.',
            success: false,
        }
    }
    
    revalidatePath(`/dashboard/project/${projectId}`);
    return {
        errors: {},
        message: 'Task created successfully.',
        success: true
    }
}
