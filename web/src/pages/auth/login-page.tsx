import { useDocumentTitle } from "../../hooks/use-document-title"
import { LoginForm } from "../../features/auth"

export default function LoginPage() {
  useDocumentTitle("Sign In | V Try-On")
  return <LoginForm />
}
