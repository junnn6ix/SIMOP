import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function LoginLoading() {
  return <LoadingSkeleton variant="form" count={2} />;
}

