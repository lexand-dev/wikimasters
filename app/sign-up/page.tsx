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
import { authClient } from "@/lib/auth-client";

interface FormState {
  name: string;
  email: string;
  password: string;
}

interface FormErrors extends Partial<FormState> {
  form?: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 8)
      next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const { error } = await authClient.signUp.email({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message ?? "Sign up failed");
      return;
    }

    toast.success("Account created successfully");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Sign up to start contributing to the wiki.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Field orientation="vertical">
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </Field>

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
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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
                    Creating account…
                  </>
                ) : (
                  "Sign up"
                )}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
