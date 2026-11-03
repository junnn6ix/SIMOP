import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { PageContainer } from '@/components/layout/PageContainer';

export default function DevUiLoading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <LoadingSkeleton variant="card" count={4} />
        <LoadingSkeleton variant="table" count={5} />
      </div>
    </PageContainer>
  );
}

