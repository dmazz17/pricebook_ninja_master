'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardHeader({ companyName, userName }: { companyName: string; userName: string; }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting('Good morning');
    } else if (hours < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  if (!greeting) {
    return <Skeleton className="h-14 w-80" />;
  }

  return (
    <div>
      <h1 className="font-headline text-3xl font-bold tracking-tight">{companyName}</h1>
      <p className="text-muted-foreground">{greeting}, {userName}. Welcome to your dashboard.</p>
    </div>
  );
}
