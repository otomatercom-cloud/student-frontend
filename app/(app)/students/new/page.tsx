'use client';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/api';
import { PageHeader, Spinner, ErrorBox } from '@/components/ui';
import StudentForm from '@/components/StudentForm';

export default function NewStudent() {
  const router = useRouter();
  const { data: meta, loading, error } = useApi<any>('meta');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox text={error} />;
  return (<><PageHeader title="Add Student" /><StudentForm meta={meta} onSaved={(id) => router.push('/students/' + id)} /></>);
}
