"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
  confirmMessage?: string;
};

export function SubmitButton({
  children,
  pendingText = "Processing…",
  confirmMessage,
  disabled,
  onClick,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={disabled || pending}
      aria-busy={pending}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          confirmMessage &&
          !window.confirm(confirmMessage)
        ) {
          event.preventDefault();
        }
      }}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function FormPendingIndicator({
  text = "Switching venue…",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return (
    <span
      role="status"
      className={`mt-2 flex items-center gap-2 text-xs ${className}`}
    >
      <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
      {text}
    </span>
  );
}
