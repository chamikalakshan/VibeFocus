import { Bell, Brush, Clock3, Database, Download, ShieldAlert, SlidersHorizontal, UserRound } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { updateSettings } from "@/actions/settings"
import { ThemeSync } from "@/components/settings/ThemeSync"
import { NotificationControl } from "@/components/settings/NotificationControl"
import { DeleteAccountButton } from "@/components/settings/DeleteAccountButton"
import { DeleteCompletedButton } from "@/components/settings/DeleteCompletedButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Page, PageHeader } from "@/components/ui/page"
import { createClient } from "@/utils/supabase/server"
import { defaultSettings, isMissingSettingsTable, parseStoredSettings } from "@/lib/domain/settings"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const result = user ? await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle() : { data: null, error: null }
  const metadataSettings = parseStoredSettings(user?.user_metadata?.vibefocus_settings)
  const canonicalSettings = parseStoredSettings(result.data)
  const settings = canonicalSettings ?? (isMissingSettingsTable(result.error) ? metadataSettings : null) ?? defaultSettings

  return <Page className="max-w-5xl">
    <ThemeSync theme={settings.theme} />
    <PageHeader eyebrow="Make the workspace yours" title="Settings" description="Adjust how VibeFocus looks, feels, and supports your attention." />
    <form action={updateSettings} className="space-y-4">
      <SettingsSection icon={UserRound} title="Account" description="Your identity and local planning context.">
        <Field label="Display name"><Input name="display_name" defaultValue={settings.display_name ?? ""} /></Field>
        <Field label="Email address" hint="Managed by your sign-in provider"><Input value={user?.email ?? ""} disabled /></Field>
        <Field label="Timezone" hint="Used for Today and streak calculations"><Input name="timezone" defaultValue={settings.timezone} /></Field>
      </SettingsSection>

      <SettingsSection icon={Brush} title="Appearance" description="Keep the interface comfortable for long sessions.">
        <Field label="Color theme"><select name="theme" defaultValue={settings.theme} className="block h-11 w-full rounded-xl border bg-[var(--surface-secondary)] px-3"><option value="dark">Dark</option><option value="light">Light</option><option value="system">Use system setting</option></select></Field>
        <SettingToggle name="reduced_motion" title="Reduce motion" description="Use quieter transitions throughout the app." checked={settings.reduced_motion} />
      </SettingsSection>

      <SettingsSection icon={Clock3} title="Focus experience" description="Choose useful defaults without locking yourself in.">
        <Field label="Default focus duration"><Input name="default_focus_minutes" type="number" min="1" max="60" defaultValue={settings.default_focus_minutes} /></Field>
        <Field label="Default break duration"><Input name="default_break_minutes" type="number" min="1" max="60" defaultValue={settings.default_break_minutes} /></Field>
        <SettingToggle name="audio_enabled" title="Lo-fi audio" description="Make ambient audio available during focus." checked={settings.audio_enabled} />
        <SettingToggle name="timer_sound_enabled" title="Completion sound" description="Play a gentle sound when time is up." checked={settings.timer_sound_enabled} />
        <SettingToggle name="auto_start_break" title="Auto-start break" description="Move directly into a break after focus." checked={settings.auto_start_break} />
        <SettingToggle name="auto_complete_task" title="Auto-complete task" description="Mark the task complete with the session." checked={settings.auto_complete_task} />
      </SettingsSection>

      <SettingsSection icon={Bell} title="Notifications" description="Use reminders intentionally, not constantly.">
        <SettingToggle name="notifications_enabled" title="Focus reminders" description="Allow scheduled reminders and focus-completion notifications." checked={settings.notifications_enabled} />
        <div className="md:col-span-2"><NotificationControl /></div>
      </SettingsSection>
      <div className="sticky bottom-24 z-20 flex justify-end md:bottom-5"><Button size="lg" className="accent-glow"><SlidersHorizontal />Save preferences</Button></div>
    </form>

    <SettingsSection icon={Database} title="Data management" description="Take a copy or clear completed work.">
      <ActionRow icon={Download} title="Export account data" description="Download your tasks, sessions, settings, and insights."><Button asChild variant="outline"><a href="/api/account/export">Export data</a></Button></ActionRow>
      <ActionRow icon={Database} title="Delete completed tasks" description="Permanently remove completed tasks and their associated history."><DeleteCompletedButton /></ActionRow>
    </SettingsSection>

    <section className="dashboard-panel rounded-[1.4rem] border-[var(--danger)]/30 p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--danger-soft)] text-[var(--danger)]"><ShieldAlert className="size-5" /></div><div><h2 className="font-semibold">Danger zone</h2><p className="mt-1 max-w-xl text-sm leading-5 text-muted-foreground">Deleting your account permanently removes your VibeFocus identity and all associated data.</p></div></div><DeleteAccountButton /></div></section>
  </Page>
}

function SettingsSection({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: React.ReactNode }) {
  return <section className="dashboard-panel rounded-[1.4rem] p-5 sm:p-6"><div className="mb-6 flex gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Icon className="size-5" /></div><div><h2 className="text-lg font-semibold tracking-[-.025em]">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div><div className="grid gap-4 md:grid-cols-2">{children}</div></section>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="space-y-2 text-sm font-medium">{label}{children}{hint && <span className="block text-xs font-normal text-muted-foreground">{hint}</span>}</label>
}

function SettingToggle({ name, title, description, checked }: { name: string; title: string; description: string; checked: boolean }) {
  return <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-[var(--surface-secondary)] p-4"><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span><input type="checkbox" name={name} defaultChecked={checked} className="size-5 accent-[var(--accent-primary)]" /></label>
}

function ActionRow({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-4 rounded-2xl bg-[var(--surface-secondary)] p-4 sm:flex-row sm:items-center sm:justify-between md:col-span-2"><div className="flex items-center gap-3"><Icon className="size-5 text-muted-foreground" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div></div>{children}</div>
}
