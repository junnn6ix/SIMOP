import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function PegawaiJadwalLoading() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <LoadingSkeleton variant="card" className="h-20" />
        <div className="space-y-3">
          <LoadingSkeleton variant="card" className="h-32" />
          <LoadingSkeleton variant="card" className="h-32" />
        </div>
      </div>
    </PageContainer>
  );
}

