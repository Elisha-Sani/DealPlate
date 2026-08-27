"use client";

import { useState, useCallback, useId } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import type { SignUpFormData } from "@/types";
import { supabase } from "@/lib/supabase/client";

type FieldErrors = Partial<Record<keyof SignUpFormData, string>>;

const KENYA_PHONE_RE = /^(?:\+254|0)7\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.(edu|ac\.[a-z]{2})$/i;

function validate(form: SignUpFormData): FieldErrors {
    const errors: FieldErrors = {};

    if (!form.fullName.trim()) {
        errors.fullName = "Enter your full name.";
    } else if (form.fullName.trim().length < 2) {
        errors.fullName = "Name looks too short.";
    }

    if (!form.phone.trim()) {
        errors.phone = "Enter your M-Pesa number.";
    } else if (!KENYA_PHONE_RE.test(form.phone.replace(/\s/g, ""))) {
        errors.phone = "Use a valid number, e.g. +254 7XX XXX XXX.";
    }

    if (!form.email.trim()) {
        errors.email = "Enter your university email.";
    } else if (!EMAIL_RE.test(form.email.trim())) {
        errors.email = "Use your .edu or .ac university address.";
    }

    if (!form.password) {
        errors.password = "Create a password.";
    } else if (form.password.length < 8) {
        errors.password = "Use at least 8 characters.";
    }

    return errors;
}

const inputClasses = (hasError: boolean) =>
    `w-full h-12 rounded-lg border bg-white px-4 text-sm outline-none transition-all focus:ring-2 ${
        hasError
            ? "border-red-300 focus:ring-red-400"
            : "border-gray-200 focus:ring-[#FF6B00]"
    }`;

interface FieldProps {
    id: string;
    label: string;
    type: string;
    placeholder: string;
    value: string;
    error?: string;
    autoComplete?: string;
    endAdornment?: React.ReactNode;
    onChange: (value: string) => void;
}

function Field({
    id,
    label,
    type,
    placeholder,
    value,
    error,
    autoComplete,
    endAdornment,
    onChange,
}: FieldProps) {
    const errorId = `${id}-error`;
    return (
        <div>
            <label
                htmlFor={id}
                className="block text-xs font-bold text-[#5a4136] uppercase tracking-wider mb-1.5 ml-2"
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    autoComplete={autoComplete}
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : undefined}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${inputClasses(!!error)} ${endAdornment ? "pr-11" : ""}`}
                />
                {endAdornment}
            </div>
            {error && (
                <p
                    id={errorId}
                    className="mt-1 ml-2 text-xs font-semibold text-red-600"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

export default function StudentSignUp() {
    const router = useRouter();
    const formIdBase = useId();
    const [form, setForm] = useState<SignUpFormData>({
        fullName: "",
        phone: "",
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [confirmationSent, setConfirmationSent] = useState(false);

    const updateField = useCallback(
        (key: keyof SignUpFormData, value: string) => {
            setForm((prev) => ({ ...prev, [key]: value }));
            setErrors((prev) =>
                prev[key] ? { ...prev, [key]: undefined } : prev,
            );
        },
        [],
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const fieldErrors = validate(form);
        setErrors(fieldErrors);

        if (Object.keys(fieldErrors).length > 0) {
            setSubmitError("Please fix the highlighted fields.");
            return;
        }

        setSubmitError("");
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        full_name: form.fullName,
                        phone: form.phone,
                    },
                    // If "Confirm email" is enabled in Supabase, this is where
                    // the confirmation link sends the user — through the
                    // code-exchange callback (safe here, since unlike a
                    // password-reset link, the user typically confirms in the
                    // same browser they signed up in) rather than the bare
                    // Site URL, which has no code-exchange logic at all.
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/student/verify`,
                }
            });

            if (error) {
                setSubmitError(error.message);
                setIsSubmitting(false);
                return;
            }

            // Supabase returns a 200 with a user that has an empty
            // `identities` array (instead of an error) when the email is
            // already registered, to avoid leaking account existence.
            if (data.user && data.user.identities?.length === 0) {
                setSubmitError(
                    "An account with this email already exists. Try signing in instead."
                );
                setIsSubmitting(false);
                return;
            }

            // The database trigger 'handle_new_student_user' will automatically
            // create the student_profiles row using the options.data we provided above.

            if (!data.session) {
                // "Confirm email" is enabled and no session was issued yet —
                // pushing to /student/verify here would just be a dead end,
                // since that page requires auth and the user isn't signed in
                // until they click the confirmation link.
                setIsSubmitting(false);
                setConfirmationSent(true);
                return;
            }

            router.push("/student/verify");
        } catch {
            setSubmitError("Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-105 w-full mx-auto py-6"
        >
            <div className="text-center mb-8">
                <h2 className="font-display font-extrabold text-3xl tracking-tight text-[#111827] mb-2">
                    Join DealPlate
                </h2>
                <p className="text-[#5a4136] text-sm">
                    Get exclusive student flash deals on local meals.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6 shadow-md">
                {confirmationSent ? (
                    <div className="text-center py-4 space-y-2">
                        <h3 className="font-display font-bold text-lg text-[#111827]">Check your email</h3>
                        <p className="text-sm text-gray-500">
                            We&apos;ve sent a confirmation link to <span className="font-semibold">{form.email}</span>.
                            Click it to activate your account, then sign in to continue.
                        </p>
                    </div>
                ) : (
                <>
                {submitError && (
                    <div
                        role="alert"
                        className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2"
                    >
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>{submitError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <Field
                        id={`${formIdBase}-fullName`}
                        label="Full Name"
                        type="text"
                        placeholder="John Kamau"
                        value={form.fullName}
                        error={errors.fullName}
                        autoComplete="name"
                        onChange={(v) => updateField("fullName", v)}
                    />
                    <Field
                        id={`${formIdBase}-phone`}
                        label="Phone Number (M-Pesa)"
                        type="tel"
                        placeholder="+254 7XX XXX XXX"
                        value={form.phone}
                        error={errors.phone}
                        autoComplete="tel"
                        onChange={(v) => updateField("phone", v)}
                    />
                    <Field
                        id={`${formIdBase}-email`}
                        label="University Email"
                        type="email"
                        placeholder="student@university.edu"
                        value={form.email}
                        error={errors.email}
                        autoComplete="email"
                        onChange={(v) => updateField("email", v)}
                    />
                    <Field
                        id={`${formIdBase}-password`}
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        error={errors.password}
                        autoComplete="new-password"
                        onChange={(v) => updateField("password", v)}
                        endAdornment={
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-[#5a4136]"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        }
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#FF6B00] text-white rounded-lg font-bold hover:bg-[#e66000] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-60 disabled:active:scale-100"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <span>Next: Verify Student Status</span>
                        )}
                    </button>
                </form>
                </>
                )}
            </div>

            <div className="mt-6 text-center">
                <Link
                    href="/student/sign-in"
                    className="text-xs font-bold text-[#FF6B00] hover:underline"
                >
                    Already have an account? Sign In
                </Link>
            </div>
        </motion.div>
    );
}
