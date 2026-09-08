import { Logo } from "../../../components/brand/Logo"

export function AuthBrand() {
  return (
    <div className="flex justify-center pb-2">
      <Logo className="h-7 w-auto" linkToHome={true} />
    </div>
  )
}
