import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, InformationCircleIcon } from "@hugeicons/core-free-icons"
import { loginSchema, type LoginFormData } from "../schemas"
import { useAuth } from "../use-auth"
import { applyServerValidationErrors, type ContextualFormError } from "../../../lib/forms"
import { AuthBrand } from "./auth-brand"
import { PasswordField } from "./password-field"
import { AuthFormError } from "./auth-form-error"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { ROUTES } from "../../../app/route-paths"
import { getSafeRedirectTarget } from "../../../lib/auth/safe-redirect"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"

export function LoginForm() {
  const { login, authReason, clearAuthReason } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const prefersReduced = useReducedMotion()

  const [serverError, setServerError] = useState<ContextualFormError | null>(null)

  // Session expiry detection & safe redirect target
  const locationState = location.state as { returnTo?: string; reason?: string } | null
  const isExpired = locationState?.reason === "session-expired" || authReason === "session-expired"
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<boolean>(isExpired)

  const candidateReturnTo = searchParams.get("returnTo") || locationState?.returnTo
  const returnTo = getSafeRedirectTarget(candidateReturnTo, ROUTES.app.studio)

  // Clear authReason and replace history state on mount so subsequent manual refresh doesn't show stale session-expired banner
  useEffect(() => {
    if (authReason) {
      clearAuthReason()
    }
    if (locationState?.reason) {
      window.history.replaceState({ returnTo: locationState.returnTo }, document.title)
    }
  }, [authReason, clearAuthReason, locationState])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)
    setSessionExpiredNotice(false)
    try {
      await login(data)
      navigate(returnTo, { replace: true })
    } catch (err) {
      const { contextualError } = applyServerValidationErrors(
        setError,
        err,
        ["email", "password"],
        "We couldn't sign you in right now. Please try again."
      )
      setServerError(contextualError)
    }
  }

  const registerLink =
    returnTo && returnTo !== ROUTES.app.studio
      ? `${ROUTES.auth.register}?returnTo=${encodeURIComponent(returnTo)}`
      : ROUTES.auth.register

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-[440px] mx-auto p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border bg-card/80 backdrop-blur-md shadow-2xl space-y-6 auth-card-compact text-card-foreground"
    >
      {/* Brand & Editorial Heading */}
      <div className="space-y-3 text-center">
        <AuthBrand />

        <div className="space-y-1">
          <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase block">
            Fitting Room Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
            Welcome back
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Sign in to manage your photos, browse looks, and revisit your generated try-ons.
        </p>
      </div>

      {/* Session Expired Quiet Notice */}
      {sessionExpiredNotice && (
        <div
          role="status"
          className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-surface-subtle text-muted-foreground text-xs"
        >
          <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0 text-foreground" />
          <span>Your session ended. Sign in again to continue.</span>
        </div>
      )}

      {/* Form-Level Server Error */}
      <AuthFormError
        message={serverError?.message}
        requestId={serverError?.requestId}
        retryAfterSeconds={serverError?.retryAfterSeconds}
      />

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-foreground">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground focus:border-ring h-11 text-sm"
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-danger">
              {errors.email.message}
            </p>
          )}
        </div>

        <PasswordField
          id="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={isSubmitting}
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full font-medium h-11 text-sm gap-2 mt-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </Button>
      </form>

      {/* Secondary Navigation */}
      <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/80">
        New to V Try-On?{" "}
        <Link
          to={registerLink}
          className="text-foreground hover:underline underline-offset-4 font-medium transition-colors"
        >
          Create an account
        </Link>
      </div>
    </motion.div>
  )
}
