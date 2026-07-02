import { EnergyAudit } from "@/components/features/EnergyAudit"
import { Page, PageHeader } from "@/components/ui/page"

export default function AuditPage() {
  return <Page className="max-w-5xl"><PageHeader eyebrow="Close the loop" title="Energy reflection" description="Notice which work gives energy back, which feels neutral, and which consistently drains you." /><EnergyAudit /></Page>
}
