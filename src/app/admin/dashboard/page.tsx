
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
            <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome to the management portal.</p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                    This is the main dashboard for the admin backend. You can add components here to manage clients, projects, and other aspects of the portal.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Admin content goes here.</p>
            </CardContent>
        </Card>

    </div>
  );
}
