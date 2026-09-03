import { Outlet } from "react-router-dom"
import { AppNavbar } from "../components/navigation/app-navbar"
import { MobileTabBar } from "../components/navigation/mobile-tabbar"

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-zinc-100 selection:bg-zinc-800 selection:text-white">
      <AppNavbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
        <Outlet />
      </main>

      <MobileTabBar />
    </div>
  )
}
