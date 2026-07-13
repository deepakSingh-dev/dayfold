import { PageHeader } from '@/components/layout/page-header';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata = { title: 'Trash · Dayfold' };

export default function TrashPage() {
  return (
    <>
      <PageHeader title="Trash" />
      <ComingSoon title="Trash" phase="Phase 2">
        Deleted projects, tasks, and pages will rest here for 30 days, ready to restore.
      </ComingSoon>
    </>
  );
}
