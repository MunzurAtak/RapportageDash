"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: string;
  pendingText?: string;
  className?: string;
};

export function SubmitButton({
  children,
  pendingText = "Bezig...",
  className = "",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-white`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
