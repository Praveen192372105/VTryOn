import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { registerFormSchema, type RegisterFormInput } from "../schemas"
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

export function RegisterForm() {
  const { register: registerAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const prefersReduced = useReducedMotion()

  const [serverError, setServerError] = useState<ContextualFormError | null>(null)

  const candidateReturnTo =
    searchParams.get("returnTo") ||
    (location.state as { returnTo?: string } | null)?.returnTo
  const returnTo = getSafeRedirectTarget(candidateReturnTo, ROUTES.app.studio)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: RegisterFormInput) => {
    setServerError(null)
    try {
      // Send only backend-required fields
      await registerAuth({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      navigate(returnTo, { replace: true })
    } catch (err) {
      const { contextualError } = applyServerValidationErrors(
        setError,
        err,
        ["name", "email", "password", "confirmPassword"],
        "We couldn't create your account right now. Please try again."
      )
      setServerError(contextualError)
    }
  }

  const loginLink =
    returnTo && returnTo !== ROUTES.app.studio
      ? `${ROUTES.auth.login}?returnTo=${encodeURIComponent(returnTo)}`
      : ROUTES.auth.login

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-[460px] mx-auto p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-border bg-card/80 backdrop-blur-md shadow-2xl space-y-5 sm:space-y-6 auth-card-compact text-card-foreground"
    >
      {/* Brand & Editorial Heading */}
      <div className="space-y-3 text-center">
        <AuthBrand />

        <div className="space-y-1">
          <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase block">
            New Silhouette
          </span>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
            Create your fitting room
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Set up an isolated wardrobe environment for bespoke AI virtual try-on generations.
        </p>
      </div>

      {/* Form-Level Server Error */}
      <AuthFormError
        message={serverError?.message}
        requestId={serverError?.requestId}
        retryAfterSeconds={serverError?.retryAfterSeconds}
      />

      {/* Register Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-foreground">
            Full name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Jane Doe"
            autoComplete="name"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground focus:border-ring h-11 text-sm"
            {...register("name")}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-danger">
              {errors.name.message}
            </p>
          )}
        </div>

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
          autoComplete="new-password"
          disabled={isSubmitting}
          helperText="Use at least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full font-medium h-11 text-sm gap-2 mt-2"
        >
          {isSubmitting ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
              <span>Creating account…</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </Button>
      </form>

      {/* Secondary Navigation */}
      <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/80">
        Already have an account?{" "}
        <Link
          to={loginLink}
          className="text-foreground hover:underline underline-offset-4 font-medium transition-colors"
        >
          Sign in
        </Link>
      </div>
    </motion.div>
  )
}
