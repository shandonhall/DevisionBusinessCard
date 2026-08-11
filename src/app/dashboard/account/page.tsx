import { ChangePasswordForm } from "@/components/forms/change-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuthContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const context = await requireAuthContext();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
        <p className="text-[var(--brand-muted-text)]">
          Signed in as{" "}
          <span className="font-medium text-[var(--brand-text)]">
            {context.email}
          </span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Use a strong password of at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
