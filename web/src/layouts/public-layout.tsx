import { Outlet } from "react-router-dom"

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-zinc-100 selection:bg-zinc-800 selection:text-white">
      <Outlet />
    </div>
  )
}
