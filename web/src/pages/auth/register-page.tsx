import { useDocumentTitle } from "../../hooks/use-document-title"
import { RegisterForm } from "../../features/auth"

export default function RegisterPage() {
  useDocumentTitle("Create Account | V Try-On")
  return <RegisterForm />
}
