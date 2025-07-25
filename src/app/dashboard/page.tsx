
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getClientDataByEmail } from '@/lib/data';
import { redirect } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';
import DashboardHeader from '@/components/dashboard/header';
import CompanyCard from '@/components/dashboard/company-card';
import UserCard from '@/components/dashboard/user-card';
import ProjectsTable from '@/components/dashboard/projects-table';
import EventsCard from '@/components/dashboard/events-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { currentUser } from '@clerk/nextjs/server';

export const metadata: Metadata = {
  title: 'Your Dashboard',
};

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user || !user.primaryEmailAddress) {
    // This case should ideally be handled by middleware or the root page
    redirect('/sign-in');
  }

  const userEmail = user.primaryEmailAddress.emailAddress;

  // Fetch data in parallel
  const clientData = await getClientDataByEmail(userEmail);

  if (!clientData || !clientData.user) {
    // This could redirect to the login page with an error message
    // or show a "welcome, we're setting up your account" page.
    // For now, we'll handle the common case where a user might exist in Clerk
    // but not yet in our contacts table (e.g. after first sign-up).
     return (
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
           <DashboardHeader companyName="Welcome" userName={user.firstName || user.emailAddresses[0].emailAddress} />
        </div>
        <div className="flex items-center justify-center text-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                    <CardDescription>Your account is ready.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>If you have made any purchases, they will appear in the "Purchases" section shortly. If you believe you are missing access to a project, please contact support.</p>
                </CardContent>
            </Card>
       </div>
      </div>
    )
  }

  const { company, projects, events } = clientData;
  const displayUser = clientData.user;

  // Handle case where user is a guest or has no company data yet
  if (!company) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
           <DashboardHeader companyName="Welcome" userName={displayUser.name} />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-5">
           <div className="lg:col-span-1 xl:col-span-2 space-y-4 md:space-y-8">
            <Suspense fallback={<Skeleton className="h-60 rounded-xl" />}>
               <UserCard user={displayUser} />
             </Suspense>
           </div>
            <div className="lg:col-span-2 xl:col-span-3 space-y-4 md:space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>Your account is being set up.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>You will soon be assigned your purchased pricebooks and other materials. Please check back later or visit the "Purchases" tab.</p>
                    </CardContent>
                </Card>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <DashboardHeader companyName={company.name} userName={displayUser.name} />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-5">
        <div className="lg:col-span-1 xl:col-span-2 space-y-4 md:space-y-8">
           <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
             <CompanyCard company={company} />
           </Suspense>
           <Suspense fallback={<Skeleton className="h-60 rounded-xl" />}>
             <UserCard user={displayUser} />
           </Suspense>
        </div>
        <div className="lg:col-span-2 xl:col-span-3 space-y-4 md:space-y-8">
          <Suspense fallback={<Skeleton className="h-[500px] rounded-xl" />}>
            <ProjectsTable projects={projects} userId={displayUser.id} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
            <EventsCard events={events} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
