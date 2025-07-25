'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { addComment, type AddCommentState } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Comment
        </Button>
    );
}

export function AddCommentForm({ projectId, userId }: { projectId: string; userId: string }) {
    const initialState: AddCommentState = { message: null, errors: {}, success: false };
    const [state, dispatch] = useActionState(addComment, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            formRef.current?.reset();
        }
    }, [state.success]);

    return (
        <form action={dispatch} ref={formRef} className="space-y-4">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="userId" value={userId} />
            <div className="space-y-2">
                <Label htmlFor="content">Add a comment</Label>
                <Textarea
                    id="content"
                    name="content"
                    placeholder="Type your comment here..."
                    rows={4}
                    required
                    aria-describedby="content-error"
                />
                <div id="content-error" aria-live="polite" aria-atomic="true">
                    {state.errors?.content &&
                        state.errors.content.map((error: string) => (
                        <p className="mt-2 text-sm text-destructive" key={error}>
                            {error}
                        </p>
                        ))}
                </div>
            </div>
            <div className="flex justify-end items-center gap-4">
                 {state.message && !state.success && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{state.message}</span>
                    </div>
                 )}
                <SubmitButton />
            </div>
        </form>
    );
}
