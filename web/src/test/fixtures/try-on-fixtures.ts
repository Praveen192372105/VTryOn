import type { TryOnJob, TryOnStatus } from "../../features/try-on/types"

/**
 * Explicit Try-On Job Fixtures for Component, Integration, and E2E Tests.
 *
 * Section 21.1: Never make component tests depend on a locally running CatVTON model.
 */

export const mockQueuedJob: TryOnJob = {
  id: "job_fixture_queued_1",
  status: "queued" as TryOnStatus,
  person_upload_id: "upl_fixture_person_1",
  outfit_id: "out_fixture_outfit_1",
  created_at: "2026-09-05T10:00:00.000Z",
  started_at: null,
  finished_at: null,
  result: null,
  error: null,
  result_image_url: null,
  error_code: null,
  error_message: null,
}

export const mockProcessingJob: TryOnJob = {
  id: "job_fixture_processing_1",
  status: "processing" as TryOnStatus,
  person_upload_id: "upl_fixture_person_1",
  outfit_id: "out_fixture_outfit_1",
  created_at: "2026-09-05T10:00:00.000Z",
  started_at: "2026-09-05T10:00:05.000Z",
  finished_at: null,
  result: null,
  error: null,
  result_image_url: null,
  error_code: null,
  error_message: null,
}

export const mockSucceededJob: TryOnJob = {
  id: "job_fixture_succeeded_1",
  status: "succeeded" as TryOnStatus,
  person_upload_id: "upl_fixture_person_1",
  outfit_id: "out_fixture_outfit_1",
  created_at: "2026-09-05T10:00:00.000Z",
  started_at: "2026-09-05T10:00:05.000Z",
  finished_at: "2026-09-05T10:00:35.000Z",
  completed_at: "2026-09-05T10:00:35.000Z",
  result: {
    id: "res_fixture_1",
    image_url: "/api/v1/try-ons/job_fixture_succeeded_1/content",
    width: 768,
    height: 1024,
    mime_type: "image/jpeg",
    model_version: "catvton-v1.2",
    created_at: "2026-09-05T10:00:35.000Z",
  },
  result_image_url: "/api/v1/try-ons/job_fixture_succeeded_1/content",
  error: null,
  error_code: null,
  error_message: null,
}

export const mockFailedJob: TryOnJob = {
  id: "job_fixture_failed_1",
  status: "failed" as TryOnStatus,
  person_upload_id: "upl_fixture_person_1",
  outfit_id: "out_fixture_outfit_1",
  created_at: "2026-09-05T10:00:00.000Z",
  started_at: "2026-09-05T10:00:05.000Z",
  finished_at: "2026-09-05T10:00:15.000Z",
  completed_at: "2026-09-05T10:00:15.000Z",
  result: null,
  result_image_url: null,
  error: {
    code: "TRYON_PROCESSING_FAILED",
    message: "Generation pipeline encountered an internal error. Please try again with another photo.",
  },
  error_code: "TRYON_PROCESSING_FAILED",
  error_message: "Generation pipeline encountered an internal error. Please try again with another photo.",
}

export const mockInvalidInputJob: TryOnJob = {
  id: "job_fixture_invalid_input_1",
  status: "failed" as TryOnStatus,
  person_upload_id: "upl_fixture_person_1",
  outfit_id: "out_fixture_outfit_1",
  created_at: "2026-09-05T10:00:00.000Z",
  finished_at: "2026-09-05T10:00:02.000Z",
  result: null,
  error: {
    code: "INVALID_INPUT",
    message: "The uploaded portrait photo is too low resolution or cropped. Please use a clear portrait photo.",
  },
  error_code: "INVALID_INPUT",
  error_message: "The uploaded portrait photo is too low resolution or cropped. Please use a clear portrait photo.",
}

/**
 * Parametric factory to generate custom TryOnJob test fixtures.
 */
export function createMockTryOnJob(overrides: Partial<TryOnJob> = {}): TryOnJob {
  const base = overrides.status === "succeeded"
    ? mockSucceededJob
    : overrides.status === "failed"
    ? mockFailedJob
    : overrides.status === "processing"
    ? mockProcessingJob
    : mockQueuedJob

  return {
    ...base,
    ...overrides,
  }
}
