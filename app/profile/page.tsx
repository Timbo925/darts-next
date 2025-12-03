'use client';

import { useRouter } from 'next/navigation';
import ProfileScreen from '../components/profile/ProfileScreen';

export default function ProfilePage() {
  const router = useRouter();

  return (
    <ProfileScreen onBack={() => router.push('/')} />
  );
}

