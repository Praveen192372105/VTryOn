import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TryOnFailure } from "../try-on-failure"
import { createAllProvidersWrapper } from "../../../../test/render"
import type { TryOnJob } from "../../types"

describe("TryOnFailure", () => {
  it("renders safe user-friendly explanation and reference ID for INVALID_INPUT", () => {
    const failedJob: TryOnJob = {
      id: "job_fail_1",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "failed",
      error: {
        code: "INVALID_INPUT",
        message: "Anatomical mask could not resolve pose keypoints",
      },
      created_at: new Date().toISOString(),
    }

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_fail_1"])
    render(<TryOnFailure job={failedJob} />, { wrapper })

    expect(screen.getByText("We couldn't finish this try-on")).toBeInTheDocument()
    expect(
      screen.getByText(/The selected photo or garment could not be processed/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Reference: job_fail_1/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Try again in Studio/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Back to history/i })).toBeInTheDocument()
  })

  it("filters out raw CUDA or Celery terms from raw error message", () => {
    const failedJob: TryOnJob = {
      id: "job_fail_2",
      person_upload_id: "upl_1",
      outfit_id: "out_1",
      status: "failed",
      error: {
        code: "UNKNOWN",
        message: "CUDA out of memory: Celery worker exited with code 1",
      },
      created_at: new Date().toISOString(),
    }

    const wrapper = createAllProvidersWrapper(["/app/try-ons/job_fail_2"])
    render(<TryOnFailure job={failedJob} />, { wrapper })

    // Raw CUDA / Celery string must NOT be exposed
    expect(screen.queryByText(/CUDA out of memory/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Celery worker/i)).not.toBeInTheDocument()
    // Safe fallback shown
    expect(
      screen.getByText(/We couldn't finish this try-on. You can try again with another photo or outfit/i)
    ).toBeInTheDocument()
  })
})
