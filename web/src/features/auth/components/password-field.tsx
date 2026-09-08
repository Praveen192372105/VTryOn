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
        <Label htmlFor={id} className="text-xs font-medium text-foreground">
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
              "bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground focus:border-ring h-11 pr-12 text-sm",
              error && "border-danger/80 focus:border-danger focus:ring-danger/20",
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md cursor-pointer"
          >
            <HugeiconsIcon
              icon={showPassword ? ViewOffIcon : ViewIcon}
              className="size-4"
            />
          </button>
        </div>
        {helperText && !error && (
          <p id={`${id}-helper`} className="text-[11px] text-muted-foreground font-mono">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    )
  }
)

PasswordField.displayName = "PasswordField"
