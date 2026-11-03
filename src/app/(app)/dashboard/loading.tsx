import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { PageContainer } from '@/components/layout/PageContainer';

export default function DashboardLoading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <LoadingSkeleton variant="card" count={1} className="h-16" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton variant="card" count={4} className="h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LoadingSkeleton variant="card" count={1} className="h-64 lg:col-span-1" />
          <LoadingSkeleton variant="card" count={1} className="h-64 lg:col-span-2" />
        </div>
      </div>
    </PageContainer>
  );
}

