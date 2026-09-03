import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { loginSchema, type LoginFormData } from "../schemas"
import { useAuth } from "../use-auth"
import { mapAuthError } from "../utils/map-auth-error"
import { AuthBrand } from "./auth-brand"
import { PasswordField } from "./password-field"
import { AuthFormError } from "./auth-form-error"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { ROUTES } from "../../../app/route-paths"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const prefersReduced = useReducedMotion()

  const [serverError, setServerError] = useState<{ message: string; requestId?: string } | null>(null)

  // Validate returnTo: ensure it's a safe internal relative path
  const rawReturnTo = (location.state as { returnTo?: string })?.returnTo
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : ROUTES.studio

  const {
    register,
    handleSubmit,
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
    try {
      await login(data)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setServerError(mapAuthError(err, "We couldn't sign you in right now. Please try again."))
    }
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-[440px] mx-auto p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-zinc-950/70 shadow-2xl space-y-6 auth-card-compact"
    >
      {/* Brand & Editorial Heading */}
      <div className="space-y-3 text-center">
        <AuthBrand />

        <div className="space-y-1">
          <span className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase block">
            Fitting Room Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-100">
            Welcome back
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
          Sign in to manage your photos, browse looks, and revisit your generated try-ons.
        </p>
      </div>

      {/* Form-Level Server Error */}
      <AuthFormError
        message={serverError?.message}
        requestId={serverError?.requestId}
      />

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-zinc-300">
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
            className="bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 h-11 text-sm"
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-red-400">
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
          className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-medium h-11 text-sm gap-2 mt-2"
        >
          {isSubmitting ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </Button>
      </form>

      {/* Secondary Navigation */}
      <div className="text-center text-xs text-zinc-400 pt-2 border-t border-zinc-900/80">
        New to V Try-On?{" "}
        <Link
          to={ROUTES.register}
          className="text-zinc-200 hover:text-white underline underline-offset-4 font-medium transition-colors"
        >
          Create an account
        </Link>
      </div>
    </motion.div>
  )
}
