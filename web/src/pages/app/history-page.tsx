import { useDocumentTitle } from "../../hooks/use-document-title"
import { HistoryGrid } from "../../features/history"

export default function HistoryPage() {
  useDocumentTitle("Try-On History")

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-zinc-900">
        <h1 className="text-2xl font-light tracking-tight text-zinc-100">Try-On History</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Review past AI fitting generations, results, and garment variations.
        </p>
      </div>

      <HistoryGrid />
    </div>
  )
}
