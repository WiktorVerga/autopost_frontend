import { ReportButton } from "@/components/report-button";

/** Sign-in pages. The landing page has its own group and no report button. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <ReportButton />
    </>
  );
}
