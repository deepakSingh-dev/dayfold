import { PageHeader } from '@/components/layout/page-header';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata = { title: 'My Tasks · Dayfold' };

export default function MyTasksPage() {
  return (
    <>
      <PageHeader title="My Tasks" />
      <ComingSoon title="My Tasks" phase="Phase 2">
        Tasks assigned to you across every project — grouped by due date — will live here.
      </ComingSoon>
    </>
  );
}
