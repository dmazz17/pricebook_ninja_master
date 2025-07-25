
'use client';

import React, { Suspense } from 'react';
import SidebarNavContent from './SidebarNavContent';
import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import { Skeleton } from '../ui/skeleton';

export default function SidebarNav() {
  return (
    <>
      <ClerkLoading>
        <div className="flex flex-col gap-4 p-2 h-screen bg-gray-900">
            <div className="flex items-center gap-2.5 p-2">
                <Skeleton className="w-10 h-10 rounded-md" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 p-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
            <div className="p-2">
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <Suspense fallback={null}>
          <SidebarNavContent />
        </Suspense>
      </ClerkLoaded>
    </>
  );
}
