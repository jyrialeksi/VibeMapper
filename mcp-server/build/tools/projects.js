import { api } from '../api-client.js';
export function registerProjectTools(server) {
    server.tool('list_projects', 'List all story map projects', async () => {
        const projects = await api.get('/api/projects');
        return { content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }] };
    });
    server.tool('create_project', 'Create a new empty story map project. Parameters: name (string, required), description (string, optional)', async (args) => {
        const name = args.name;
        const description = args.description || '';
        const project = await api.post('/api/projects', { name, description });
        return { content: [{ type: 'text', text: JSON.stringify(project, null, 2) }] };
    });
    server.tool('get_project', 'Get project details by ID. Parameters: project_id (string, required)', async (args) => {
        const project = await api.get(`/api/projects/${args.project_id}`);
        return { content: [{ type: 'text', text: JSON.stringify(project, null, 2) }] };
    });
    server.tool('delete_project', 'Delete a project and all its data. Parameters: project_id (string, required)', async (args) => {
        await api.delete(`/api/projects/${args.project_id}`);
        return { content: [{ type: 'text', text: `Project ${args.project_id} deleted.` }] };
    });
}
//# sourceMappingURL=projects.js.map