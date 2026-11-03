/** Full-screen shell for the template editor: no sidebar, the page owns the viewport. */
export default function TemplateEditorLayout({ children }: LayoutProps<"/">) {
  return <div className="h-dvh overflow-hidden bg-background">{children}</div>;
}
