import { Link } from "react-router-dom"
import { Logo } from "../../../components/brand/Logo"
import { useAuth } from "../../auth"
import { ROUTES } from "../../../app/route-paths"

export function LandingFooter() {
  const { isAuthenticated } = useAuth()

  return (
    <footer className="relative bg-background border-t border-border pt-16 pb-12 text-muted-foreground overflow-hidden select-none">
      {/* Decorative Typography Backdrop */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 pointer-events-none text-center opacity-5 select-none overflow-hidden"
      >
        <span className="text-[12vw] font-black tracking-widest text-foreground whitespace-nowrap leading-none block">
          SEE YOURSELF IN IT
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-border">
          {/* Brand Col (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <Logo />
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed font-normal">
              High-fashion AI virtual fitting room technology. Precision garment synthesis projected directly onto user silhouette portraits.
            </p>
          </div>

          {/* Navigation Anchors (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-foreground">
              Navigation
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#how-it-works" className="hover:text-foreground transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <Link to={ROUTES.howItWorks} className="text-muted-foreground hover:text-foreground transition-colors">
                  Product Guide (Full)
                </Link>
              </li>
              <li>
                <a href="#experience" className="hover:text-foreground transition-colors">
                  Fitting experience
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-foreground transition-colors">
                  Privacy architecture
                </a>
              </li>
              <li>
                <a href="#trust" className="hover:text-foreground transition-colors">
                  Trust & limitations
                </a>
              </li>
            </ul>
          </div>

          {/* Account & Session (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-foreground">
              Workspace
            </p>
            <ul className="space-y-2 text-xs">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to={ROUTES.studio} className="hover:text-foreground transition-colors">
                      Fitting Studio
                    </Link>
                  </li>
                  <li>
                    <Link to={ROUTES.outfits} className="hover:text-foreground transition-colors">
                      Outfit Catalogue
                    </Link>
                  </li>
                  <li>
                    <Link to={ROUTES.history} className="hover:text-foreground transition-colors">
                      Fitting History
                    </Link>
                  </li>
                  <li>
                    <Link to={ROUTES.settings} className="hover:text-foreground transition-colors">
                      Account Settings
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to={ROUTES.register} className="hover:text-foreground transition-colors">
                      Create an account
                    </Link>
                  </li>
                  <li>
                    <Link to={ROUTES.login} className="hover:text-foreground transition-colors">
                      Sign in
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Trust Line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-muted-foreground">
          <p>© {new Date().getFullYear()} V Try-On. Synthetic drape & garment fit engine.</p>
          <div className="flex items-center gap-4">
            <Link to={ROUTES.privacy} className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link to={ROUTES.terms} className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <span>·</span>
            <span>Zero Tracking Pixels</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
