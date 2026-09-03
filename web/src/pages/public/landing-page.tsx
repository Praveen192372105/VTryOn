import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useDocumentTitle } from "../../hooks/use-document-title"
import {
  LandingHeader,
  LandingFooter,
  HeroSection,
  ProductThesisSection,
  HowItWorksSection,
  TryOnFlowSection,
  IdentitySection,
  OutfitExperienceSection,
  ProcessingSection,
  ResultExperienceSection,
  PrivacySection,
  AsyncUxSection,
  ResponsiveSection,
  WhatItIsSection,
  TrustSection,
  FinalCtaSection,
  PageProgressController,
} from "../../features/landing"
import { scrollToSection } from "../../lib/utils/scroll-to-section"

export default function LandingPage() {
  useDocumentTitle("AI Virtual Fitting Room | V Try-On")
  const location = useLocation()

  // Handle hash navigation on initial render or location change
  useEffect(() => {
    if (location.hash) {
      const timer = setTimeout(() => {
        scrollToSection(location.hash, false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [location.hash])

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 selection:bg-zinc-800 selection:text-white">
      <LandingHeader />
      <main id="main-content" className="flex-1">
        {/* 01. Hero */}
        <HeroSection />

        {/* 02. Product Thesis */}
        <ProductThesisSection />

        {/* 03. How It Works */}
        <HowItWorksSection />

        {/* 04. The Try-On Flow */}
        <TryOnFlowSection />

        {/* 05. Identity Preservation Philosophy */}
        <IdentitySection />

        {/* 06. Outfit Selection Experience */}
        <OutfitExperienceSection />

        {/* 07. Truthful AI Processing */}
        <ProcessingSection />

        {/* 08. Result Experience */}
        <ResultExperienceSection />

        {/* 09. Privacy & Personal Media */}
        <PrivacySection />

        {/* 10. Built Around Real Async States */}
        <AsyncUxSection />

        {/* 11. Designed for Real Devices */}
        <ResponsiveSection />

        {/* 12. What V Try-On Is / Is Not */}
        <WhatItIsSection />

        {/* 13. Trust, Limitations & Product Commitment */}
        <TrustSection />

        {/* 14. Final CTA */}
        <FinalCtaSection />
      </main>
      <LandingFooter />

      {/* Floating Bottom-Right Page Progress & Scroll-to-Top Controller */}
      <PageProgressController />
    </div>
  )
}
