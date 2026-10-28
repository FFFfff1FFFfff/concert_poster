import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DATA, listJSON, writeJSON, filePath, localRequest, errorResponse } from '../../../lib/storage.mjs';
import { validateProject } from '../../../lib/project.mjs';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
  const projects = await listJSON(path.join(DATA, 'projects'));
  return Response.json(projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}
export async function POST(request) {
  try {
    localRequest(request);
    const project = validateProject(await request.json());
    project.id ||= randomUUID();
    project.updatedAt = new Date().toISOString();
    await writeJSON(filePath('projects', project.id), project);
    return Response.json(project);
  } catch (error) { return errorResponse(error); }
}
