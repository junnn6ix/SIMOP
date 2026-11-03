import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function PegawaiTiketLoading() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <LoadingSkeleton variant="card" className="h-20" />
        <LoadingSkeleton variant="table" count={5} />
      </div>
    </PageContainer>
  );
}

