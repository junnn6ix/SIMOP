import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function AdminVerifikasiLoading() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <LoadingSkeleton variant="card" className="h-20" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingSkeleton variant="card" className="h-44" />
          <LoadingSkeleton variant="card" className="h-44" />
        </div>
      </div>
    </PageContainer>
  );
}

