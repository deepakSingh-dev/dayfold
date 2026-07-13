import {
  requireSession,
  getActiveWorkspace,
  getWorkspaceProjects,
  getWorkspacePages,
} from '@/lib/session';
import { Sidebar } from '@/components/layout/sidebar';

/**
 * Protected app shell. Enforces a session, loads the active workspace and the
 * sidebar's project/page lists, and frames every app route with the sidebar.
 */
export default async function AppLayout({ children }) {
  const session = await requireSession();
  const workspace = await getActiveWorkspace(session.user.id);

  const [projects, pages] = await Promise.all([
    getWorkspaceProjects(workspace.id),
    getWorkspacePages(workspace.id),
  ]);

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} workspace={workspace} projects={projects} pages={pages} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
