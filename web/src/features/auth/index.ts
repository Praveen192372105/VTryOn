export { AuthProvider, useAuth } from "./use-auth"
export { AuthContext } from "./auth-context"
export {
  loginSchema,
  registerSchema,
  registerFormSchema,
  type LoginFormData,
  type RegisterFormData,
  type RegisterFormInput,
} from "./schemas/index"
export { loginUser, registerUser, logoutUser, getCurrentUser } from "./api/index"
export { useLogin, useRegister, useLogout, useCurrentUser } from "./hooks"
export {
  AuthBrand,
  PasswordField,
  AuthFormError,
  LoginForm,
  RegisterForm,
  AuthBootState,
  AuthCard,
  SessionNotice,
} from "./components"
export { mapAuthError } from "./utils/map-auth-error"
export type {
  AuthStatus,
  AuthNavigationReason,
  LoginCredentials,
  RegisterCredentials,
  AuthContextType,
} from "./types"
