'use client';

import { useRouter } from 'next/navigation';
import HistoryScreen from '../components/history/HistoryScreen';

export default function HistoryPage() {
  const router = useRouter();

  return (
    <HistoryScreen onBack={() => router.push('/')} />
  );
}

