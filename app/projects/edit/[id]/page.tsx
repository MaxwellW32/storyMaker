import AddEditProject from "@/components/projects/AddEditProject"
import { ensureCanAccessResource } from "@/serverFunctions/handleAuth"
import { getSpecificProject } from "@/serverFunctions/handleProjects"
import { projectType } from "@/types"

export default async function Page({ params }: { params: Promise<{ id: projectType["id"] }> }) {
    const { id } = await params
    const seenProject = await getSpecificProject(id)

    if (seenProject === undefined) return (<p>not seeing specific project</p>)

    //auth
    await ensureCanAccessResource("projects", id)

    return (
        <AddEditProject sentProject={seenProject} />
    )
}