import React, { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { cn } from "../../../lib/utils"

interface PasswordFieldProps extends React.ComponentProps<typeof Input> {
  label?: string
  error?: string
  helperText?: string
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ id = "password", label = "Password", error, helperText, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="text-xs font-medium text-zinc-300">
          {label}
        </Label>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={showPassword ? "text" : "password"}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            className={cn(
              "bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 h-11 pr-12 text-sm",
              error && "border-red-500/80 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-r-md"
          >
            <HugeiconsIcon
              icon={showPassword ? ViewOffIcon : ViewIcon}
              className="w-4 h-4"
            />
          </button>
        </div>
        {helperText && !error && (
          <p id={`${id}-helper`} className="text-[11px] text-zinc-500 font-mono">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    )
  }
)

PasswordField.displayName = "PasswordField"
