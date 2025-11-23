// Crear: src/components/test/BenchmarkTest.tsx

'use client';
import { useBenchmark } from '@/hooks/useBenchmark';

export default function BenchmarkTest() {
  const { data, loading, error } = useBenchmark(
    'onboarding_exo',
    'personas'
  );
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No benchmark</div>;
  
  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  );
}