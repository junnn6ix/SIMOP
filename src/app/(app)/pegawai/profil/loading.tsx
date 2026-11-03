import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function ProfilLoading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <LoadingSkeleton variant="card" count={1} className="h-16" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <LoadingSkeleton variant="card" count={1} className="h-80 lg:col-span-1" />
          <LoadingSkeleton variant="card" count={1} className="h-96 lg:col-span-2" />
        </div>
      </div>
    </PageContainer>
  );
}

