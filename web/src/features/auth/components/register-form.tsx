import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { registerFormSchema, type RegisterFormInput } from "../schemas"
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

export function RegisterForm() {
  const { register: registerAuth } = useAuth()
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()

  const [serverError, setServerError] = useState<{ message: string; requestId?: string } | null>(null)

  const {
    register,
    handleSubmit,
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
      navigate(ROUTES.studio, { replace: true })
    } catch (err) {
      setServerError(mapAuthError(err, "We couldn't create your account right now. Please try again."))
    }
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-[460px] mx-auto p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-zinc-950/70 shadow-2xl space-y-5 sm:space-y-6 auth-card-compact"
    >
      {/* Brand & Editorial Heading */}
      <div className="space-y-3 text-center">
        <AuthBrand />

        <div className="space-y-1">
          <span className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase block">
            New Silhouette
          </span>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-100">
            Create your fitting room
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
          Create an account to upload your photo, choose outfits, and keep your try-on history private to your account.
        </p>
      </div>

      {/* Form-Level Server Error */}
      <AuthFormError
        message={serverError?.message}
        requestId={serverError?.requestId}
      />

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-zinc-300">
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
            className="bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 h-11 text-sm"
            {...register("name")}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

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
          autoComplete="new-password"
          disabled={isSubmitting}
          helperText="Use at least 8 characters."
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
          className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-medium h-11 text-sm gap-2 mt-2"
        >
          {isSubmitting ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin" />
              <span>Creating account…</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </Button>
      </form>

      {/* Secondary Navigation */}
      <div className="text-center text-xs text-zinc-400 pt-2 border-t border-zinc-900/80">
        Already have an account?{" "}
        <Link
          to={ROUTES.login}
          className="text-zinc-200 hover:text-white underline underline-offset-4 font-medium transition-colors"
        >
          Sign in
        </Link>
      </div>
    </motion.div>
  )
}
