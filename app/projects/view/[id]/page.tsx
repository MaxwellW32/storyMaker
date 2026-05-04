import ViewProject from "@/components/projects/ViewProject"
import { getSpecificProject } from "@/serverFunctions/handleProjects"
import { projectType } from "@/types"

export default async function Page({ params }: { params: Promise<{ id: projectType["id"] }> }) {
    const { id } = await params
    const seenProject = await getSpecificProject(id)

    if (seenProject === undefined) return (<p>not seeing specific project to view</p>)

    return (
        <ViewProject seenProject={seenProject} />
    )
}