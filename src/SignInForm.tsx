/** @format */

"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

// Simple loading spinner component
function LoadingSpinner() {
    return (
        <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    );
}

export function SignInForm() {
    const { signIn } = useAuthActions();
    const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
    const [submitting, setSubmitting] = useState(false);
    const [anonymousLoading, setAnonymousLoading] = useState(false);

    return (
        <div className="w-full max-w-sm mx-auto">
            <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    const formData = new FormData(e.target as HTMLFormElement);
                    formData.set("flow", flow);
                    void signIn("password", formData)
                        .then(() => {
                            setSubmitting(false);
                        })
                        .catch((error) => {
                            let toastTitle = "";
                            if (error.message.includes("Invalid password")) {
                                toastTitle =
                                    "Invalid password. Please try again.";
                            } else {
                                toastTitle =
                                    flow === "signIn"
                                        ? "Could not sign in, did you mean to sign up?"
                                        : "Could not sign up, did you mean to sign in?";
                            }
                            toast.error(toastTitle);
                            setSubmitting(false);
                        });
                }}
            >
                <input
                    className="auth-input-field"
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                />
                <input
                    className="auth-input-field"
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                />
                <button
                    className="auth-button"
                    type="submit"
                    disabled={submitting}
                >
                    <div className="flex items-center justify-center gap-2">
                        {submitting && <LoadingSpinner />}
                        {flow === "signIn" ? "Sign in" : "Sign up"}
                    </div>
                </button>
                <div className="text-sm text-center text-muted-foreground">
                    <span>
                        {flow === "signIn"
                            ? "Don't have an account? "
                            : "Already have an account? "}
                    </span>
                    <button
                        type="button"
                        className="font-medium cursor-pointer text-primary hover:text-primary/80 hover:underline"
                        onClick={() =>
                            setFlow(flow === "signIn" ? "signUp" : "signIn")
                        }
                    >
                        {flow === "signIn"
                            ? "Sign up instead"
                            : "Sign in instead"}
                    </button>
                </div>
            </form>
            <div className="flex items-center justify-center my-6">
                <hr className="flex-1 border-border" />
                <span className="mx-4 text-sm text-muted-foreground">or</span>
                <hr className="flex-1 border-border" />
            </div>
            <button
                className="auth-button"
                disabled={anonymousLoading}
                onClick={() => {
                    setAnonymousLoading(true);
                    void signIn("anonymous")
                        .then(() => {
                            setAnonymousLoading(false);
                        })
                        .catch(() => {
                            setAnonymousLoading(false);
                        });
                }}
            >
                <div className="flex items-center justify-center gap-2">
                    {anonymousLoading && <LoadingSpinner />}
                    Sign in anonymously
                </div>
            </button>
        </div>
    );
}
