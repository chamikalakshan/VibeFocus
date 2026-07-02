import { PortfolioDetail } from "@/components/planning/PortfolioDetail"
export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) { return <PortfolioDetail entity="goals" id={(await params).id} /> }
