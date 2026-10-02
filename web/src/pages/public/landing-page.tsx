import { useEffect, useRef, useState } from "react"
import type { ReactNode, MouseEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, useScroll, useTransform } from "motion/react"
import { useAuth } from "../../features/auth"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { useReducedMotion } from "../../hooks/use-reduced-motion"
import { ROUTES } from "../../app/route-paths"
import { Logo } from "../../components/brand/Logo"
import { LogoMark } from "../../components/brand/LogoMark"
import { scrollToSection } from "../../lib/utils/scroll-to-section"
import "./landing-page.css"

const nav = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#experience", label: "The experience" },
  { href: "#privacy", label: "Privacy" },
  { href: "#trust", label: "Our promise" },
]

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: reduced ? 0 : 0.65, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
}

function MarketingHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const cta = isAuthenticated ? ROUTES.app.studio : ROUTES.auth.register
  const handleAnchor = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault()
    setMenuOpen(false)
    scrollToSection(href)
  }
  return <header className="marketing-header">
    <div className="marketing-header-inner">
      <Logo className="marketing-logo" />
      <nav className="marketing-desktop-nav" aria-label="Main navigation">{nav.map((item) => <a key={item.href} href={item.href} onClick={(event) => handleAnchor(event, item.href)}>{item.label}</a>)}</nav>
      <div className="marketing-header-actions">{!isAuthenticated && <Link className="marketing-signin" to={ROUTES.auth.login}>Sign in</Link>}<Link className="marketing-header-cta" to={cta}>{isAuthenticated ? "Open studio" : "Start your try-on"}<span aria-hidden="true">↗</span></Link></div>
      <button className="marketing-menu-button" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="marketing-mobile-nav" onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
    </div>
    {menuOpen && <nav id="marketing-mobile-nav" className="marketing-mobile-nav" aria-label="Mobile navigation">{nav.map((item) => <a key={item.href} href={item.href} onClick={(event) => handleAnchor(event, item.href)}>{item.label}</a>)}{!isAuthenticated && <Link to={ROUTES.auth.login} onClick={() => setMenuOpen(false)}>Sign in</Link>}<Link className="marketing-mobile-cta" to={cta} onClick={() => setMenuOpen(false)}>{isAuthenticated ? "Open studio" : "Start your try-on"} ↗</Link></nav>}
  </header>
}

function MarketingFooter() {
  return <footer className="marketing-footer"><div className="marketing-container marketing-footer-top"><div><Logo className="marketing-logo" /><p>Discover what feels like you, before you get dressed.</p></div><div className="marketing-footer-links"><a href="#how-it-works">How it works</a><a href="#experience">Experience</a><Link to={ROUTES.privacy}>Privacy</Link><Link to={ROUTES.terms}>Terms</Link><a href="reports/" target="_blank" rel="noreferrer" style={{ color: "#10b981", fontWeight: "600" }}>QA Reports & Dashboard ↗</a></div></div><div className="marketing-container marketing-footer-bottom"><span>© {new Date().getFullYear()} V Try-On</span><span>Made for the way you see yourself.</span></div></footer>
}

export default function LandingPage() {
  useDocumentTitle("Virtual Try-On, Reimagined | V Try-On")
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const reduced = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "18%"])
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-9%"])
  useEffect(() => {
    if (!location.hash) return
    const timer = window.setTimeout(() => scrollToSection(location.hash, false), 100)
    return () => window.clearTimeout(timer)
  }, [location.hash])
  const cta = isAuthenticated ? ROUTES.app.studio : ROUTES.auth.register
  const ctaLabel = isAuthenticated ? "Open your studio" : "Start your try-on"

  return <div className="marketing-page">
    <MarketingHeader isAuthenticated={isAuthenticated} />
    <main id="main-content">
      <section className="marketing-hero" ref={heroRef}>
        <div className="marketing-container marketing-hero-grid">
          <motion.div className="marketing-hero-copy" style={{ y: copyY }}>
            <Reveal><span className="marketing-eyebrow"><span className="marketing-eyebrow-line" /> THE FITTING ROOM, REIMAGINED</span></Reveal>
            <Reveal delay={0.08}><h1>See the outfit<br /><em>on you.</em></h1></Reveal>
            <Reveal delay={0.15}><p>Try new looks with your own photo. Explore what suits you, save the ones you love, and choose with confidence.</p></Reveal>
            <Reveal className="marketing-hero-actions" delay={0.22}><Link className="marketing-button marketing-button-dark" to={cta}>{ctaLabel}<span aria-hidden="true">↗</span></Link><a className="marketing-text-link" href="#how-it-works" onClick={(event) => { event.preventDefault(); scrollToSection("#how-it-works") }}>See how it works <span aria-hidden="true">↘</span></a></Reveal>
            <Reveal className="marketing-hero-note" delay={0.28}><span className="marketing-note-icon">✦</span><span>Your photo. Your style. Your space.</span></Reveal>
          </motion.div>
          <div className="marketing-hero-media"><motion.div className="marketing-hero-image-wrap" style={{ y: imageY }}><img src="/images/editorial-portrait.jpg" alt="Model wearing an espresso blazer and cream trousers in a softly lit studio" fetchPriority="high" /></motion.div><div className="marketing-image-index"><span>01 / 03</span><span>STYLE, BEFORE YOU COMMIT</span></div><div className="marketing-hero-stamp" aria-hidden="true"><span>YOUR LOOK<br />YOUR WAY</span><span>✳</span></div></div>
        </div>
        <div className="marketing-hero-bottom marketing-container"><span>AN INTUITIVE WAY TO EXPLORE STYLE</span><span>SCROLL TO DISCOVER ↓</span></div>
      </section>

      <section className="marketing-intro marketing-section" id="how-it-works"><div className="marketing-container">
        <Reveal className="marketing-section-heading"><span className="marketing-kicker">01 / THE IDEA</span><h2>A more personal way<br />to find your <em>next look.</em></h2><p>No guessing how a piece might feel on you. Bring your photo and an outfit together in one simple, visual experience.</p></Reveal>
        <div className="marketing-steps">{[
          ["01", "Add your photo", "Choose a clear photo of yourself to begin. You stay in control of what you upload."],
          ["02", "Pick a look", "Browse outfits and choose the one you want to see on you."],
          ["03", "See it come together", "Get a generated preview, then save your favorite looks for later."],
        ].map(([number, title, detail], index) => <Reveal key={number} className="marketing-step-card" delay={index * 0.08}><div className="marketing-step-top"><span>{number}</span><span aria-hidden="true">↗</span></div><div><h3>{title}</h3><p>{detail}</p></div></Reveal>)}</div>
      </div></section>

      <section className="marketing-experience marketing-section" id="experience"><div className="marketing-container marketing-experience-grid">
        <Reveal className="marketing-experience-image"><img src="/images/editorial-wardrobe.jpg" alt="Curated neutral garments on a walnut clothing rail" loading="lazy" /><span className="marketing-photo-caption">CURATED FOR CURIOSITY — 02 / 03</span></Reveal>
        <div className="marketing-experience-copy"><Reveal><span className="marketing-kicker">02 / THE EXPERIENCE</span><h2>Style is better<br />when it feels <em>like you.</em></h2><p>Make room to experiment. Try silhouettes you have been curious about and keep the looks that deserve another glance.</p></Reveal>
          <div className="marketing-feature-list">{[
            ["01", "Explore freely", "Move through outfit options at your own pace."],
            ["02", "Make it personal", "Preview a look with your own uploaded photo."],
            ["03", "Keep what you love", "Return to saved looks when you are ready."],
          ].map(([number, title, detail], index) => <Reveal key={number} delay={index * 0.08}><div><span>{number}</span><strong>{title}</strong><p>{detail}</p></div></Reveal>)}</div>
          <Reveal><Link className="marketing-text-link marketing-dark-link" to={cta}>{ctaLabel} <span aria-hidden="true">↗</span></Link></Reveal>
        </div>
      </div></section>

      <section className="marketing-values marketing-section" id="privacy"><div className="marketing-container"><Reveal className="marketing-values-heading"><span className="marketing-kicker">03 / MADE WITH CARE</span><h2>Thoughtful by design.<br /><em>Personal by nature.</em></h2></Reveal><div className="marketing-value-grid"><Reveal className="marketing-value-card"><span className="marketing-value-symbol" aria-hidden="true">✳</span><h3>Your space stays yours</h3><p>Your uploads and looks are connected to your account, so your fitting room feels personal.</p><Link to={ROUTES.privacy}>Read our privacy policy <span aria-hidden="true">↗</span></Link></Reveal><Reveal className="marketing-value-card marketing-value-card-accent" delay={0.1}><span className="marketing-value-symbol" aria-hidden="true">◌</span><h3>Made for real life</h3><p>Designed to feel effortless on your phone, tablet, or desktop, whenever inspiration finds you.</p><Link to={ROUTES.howItWorks}>Explore the product guide <span aria-hidden="true">↗</span></Link></Reveal></div></div></section>

      <section className="marketing-closure" id="trust"><div className="marketing-container marketing-closure-content"><Reveal><span className="marketing-kicker">04 / YOUR NEXT LOOK STARTS HERE</span><h2>Find the look that<br /><em>feels like yours.</em></h2><p>See more possibilities in your own fitting room. Generated previews are a way to explore style and may differ from real-world fit.</p><Link className="marketing-button marketing-button-light" to={cta}>{ctaLabel}<span aria-hidden="true">↗</span></Link></Reveal><div className="marketing-closure-orbit" aria-hidden="true"><LogoMark decorative size={190} /></div></div></section>
    </main>
    <MarketingFooter />
  </div>
}
