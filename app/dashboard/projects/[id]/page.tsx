import { PortfolioDetail } from "@/components/planning/PortfolioDetail"
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) { return <PortfolioDetail entity="projects" id={(await params).id} /> }
