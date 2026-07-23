"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type SignInValues,
  signInSchema,
} from "@/features/auth/schema/auth-schema";
import { authClient } from "@/lib/auth-client";

export function SignInView() {
  const router = useRouter();
  const [form, setForm] = useState<SignInValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignInValues | "form", string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof SignInValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const result = signInSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: Partial<Record<keyof SignInValues, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof SignInValues | undefined;
      if (key && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const { error } = await authClient.signIn.email({
      email: form.email.trim(),
      password: form.password,
    });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message ?? "Sign in failed");
      return;
    }

    toast.success("Signed in successfully");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Field orientation="vertical">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </Field>

              <Field orientation="vertical">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  aria-invalid={!!errors.password}
                />
                {errors.password && <FieldError>{errors.password}</FieldError>}
              </Field>

              {errors.form && <FieldError>{errors.form}</FieldError>}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
