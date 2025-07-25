
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const isAdmin = user.publicMetadata?.role === 'admin';

  if (isAdmin) {
    redirect('/admin/dashboard');
  }

  redirect(`/dashboard`);
}
