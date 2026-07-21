import { getAuthContext, jsonError, requireProject } from '@/server/api';
import { getProjectData } from '@/server/task-service';

// GET /api/projects/[id]/data — project meta + sections + top-level tasks.
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    const project = await requireProject(id, workspaceId);
    return Response.json(await getProjectData(project));
  } catch (err) {
    return jsonError(err);
  }
}
