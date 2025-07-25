import type { User } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Users } from 'lucide-react';
import Image from 'next/image';

export default function UserCard({ user }: { user: User }) {
  const initials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Your Profile</CardTitle>
        <Users className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <Image src={user.avatarUrl} alt={user.name} width={64} height={64} data-ai-hint="person portrait" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xl font-bold font-headline">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground space-y-3 pt-2">
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-3 flex-shrink-0" />
            <span>{user.email}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
