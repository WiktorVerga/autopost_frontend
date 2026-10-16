import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheckIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import type { InstagramAccount } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

import { ConnectInstagramButton } from "./connect-instagram-button";
import { DisconnectInstagramButton } from "./disconnect-instagram-button";

export const metadata: Metadata = { title: "Instagram accounts" };

export default function AccountPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Settings"
        title="Instagram accounts"
        description="The accounts Autopost publishes to. Your profile comes from Google."
      />

      <section className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <SectionTitle>Connected accounts</SectionTitle>
          <ConnectInstagramButton>Add account</ConnectInstagramButton>
        </div>

        <Suspense fallback={<Skeleton className="h-16 w-full" />}>
          <InstagramAccounts />
        </Suspense>

        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
          Access tokens are stored encrypted on the server and never reach the browser.
        </p>
      </section>
    </div>
  );
}

async function InstagramAccounts() {
  const { data, error } = await settle(serverApi.instagramAccounts());
  if (error) return <ApiNotice error={error} />;

  if (data.length === 0) {
    return (
      <div>
        <p className="font-serif text-3xl">Not connected</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a Business or Creator account to publish.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y border-y">
      {data.map(account => (
        <InstagramAccountItem key={account.id} account={account} />
      ))}
    </ul>
  );
}

function InstagramAccountItem({ account }: { account: InstagramAccount }) {
  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="truncate font-serif text-3xl">@{account.handle}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Connected {formatDate(account.updated_at)}
        </p>
      </div>
      <DisconnectInstagramButton id={account.id} username={account.handle} />
    </li>
  );
}
