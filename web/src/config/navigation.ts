import {
  SparklesIcon,
  Shirt01Icon,
  FavouriteIcon,
  Clock01Icon,
  Camera01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { ROUTES } from "../app/route-paths"

export interface NavigationItem {
  label: string
  href: string
  icon: typeof SparklesIcon
  badge?: string
}

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  {
    label: "Studio",
    href: ROUTES.studio,
    icon: SparklesIcon,
  },
  {
    label: "Outfits",
    href: ROUTES.outfits,
    icon: Shirt01Icon,
  },
  {
    label: "Favorites",
    href: ROUTES.favorites,
    icon: FavouriteIcon,
  },
  {
    label: "History",
    href: ROUTES.history,
    icon: Clock01Icon,
  },
]

export const SECONDARY_NAVIGATION: NavigationItem[] = [
  {
    label: "Uploads",
    href: ROUTES.uploads,
    icon: Camera01Icon,
  },
  {
    label: "Settings",
    href: ROUTES.settings,
    icon: Settings01Icon,
  },
]

export interface LandingNavigationItem {
  label: string
  href: string
}

export const landingNavigation: LandingNavigationItem[] = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Experience", href: "#experience" },
  { label: "Privacy", href: "#privacy" },
  { label: "Trust", href: "#trust" },
]

export const appNavigation = {
  primary: PRIMARY_NAVIGATION,
  secondary: SECONDARY_NAVIGATION,
} as const
