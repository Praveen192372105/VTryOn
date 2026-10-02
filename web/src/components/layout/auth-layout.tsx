import { Link, Outlet } from "react-router-dom"
import { AuthBackground } from "../backgrounds"
import { ROUTES } from "../../app/route-paths"
import { Logo } from "../brand/Logo"
import "./auth-layout.css"

export function AuthLayout() {
  return <AuthBackground>
    <div className="auth-editorial">
      <img src="/images/editorial-portrait.jpg" alt="" aria-hidden="true" />
      <div className="auth-editorial-shade" />
      <Link className="auth-editorial-brand" to={ROUTES.home}><Logo linkToHome={false} className="auth-editorial-logo" /></Link>
      <div className="auth-editorial-copy"><span>YOUR FITTING ROOM AWAITS</span><h2>Style starts<br />with <em>you.</em></h2><p>A more personal way to explore what feels right.</p></div>
      <div className="auth-editorial-index">01 / 03 <span>EXPLORE YOUR NEXT LOOK</span></div>
    </div>
    <div className="auth-content-column">
      <header className="auth-topbar"><Link to={ROUTES.home} className="auth-home-link h-10"><span aria-hidden="true">←</span> Back to home</Link><span>YOUR PERSONAL FITTING ROOM</span></header>
      <main className="auth-main auth-viewport-short"><Outlet /></main>
      <footer className="auth-footer"><span>© {new Date().getFullYear()} V Try-On</span><div><Link to={ROUTES.privacy}>Privacy</Link><Link to={ROUTES.terms}>Terms</Link></div></footer>
    </div>
  </AuthBackground>
}
