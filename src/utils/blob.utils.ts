import { Request, Response } from 'express';
import { del } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { asyncHandler } from './error.utils';
import { ValidationError } from '../errors';

// Shared constraints enforced at token-generation time — this is the real
// enforcement boundary (a client that bypasses the frontend is still blocked
// here), so the frontend's own size/type pre-checks are UX-only.
export const ALLOWED_IMAGE_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// The Blob store's public delivery hostname is derivable from the read-write
// token: `vercel_blob_rw_<storeId>_<secret>` → `<storeid>.public.blob.vercel-storage.com`
// (the storeId, lowercased). Deriving it keeps this correct across environments
// rather than hard-coding one store's hostname.
export function getBlobHostname(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  const match = token.match(/^vercel_blob_rw_([^_]+)_/);
  return match ? `${match[1].toLowerCase()}.public.blob.vercel-storage.com` : null;
}

// True only when `url` points at our own Blob store — never for foreign hosts
// (e.g. the existing archives.bulbagarden.net sprite override), so cleanup can
// never delete a URL that isn't ours to delete.
export function isOwnedBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const host = getBlobHostname();
  if (!host) return false;
  try {
    return new URL(url).hostname === host;
  } catch {
    return false;
  }
}

// Deletes an old Blob when it's replaced. Best-effort: a failed cleanup must
// never fail the request — the DB write is the source of truth, an orphaned
// blob is a minor storage cost. Silently no-ops for non-Blob URLs.
export async function deleteOwnedBlob(url: string | null | undefined): Promise<void> {
  if (!isOwnedBlobUrl(url)) return;
  try {
    await del(url as string);
  } catch (err) {
    console.error(`[blob] cleanup failed for ${url}:`, err);
  }
}

// Builds a thin Express handler around @vercel/blob/client's server-side
// handleUpload(). The client asks this endpoint for a short-lived upload token;
// the entity's existing write-auth middleware has already gated the request by
// the time we get here. `buildPrefix` derives the required Blob path prefix from
// the request (e.g. `sprites/pokemon/1/`) so a caller can't mint a token for a
// different entity's path. No DB write happens here — the client persists the
// resulting URL via the entity's normal PUT route.
export function createImageUploadTokenHandler(buildPrefix: (req: Request) => string) {
  return asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const prefix = buildPrefix(req);
    const jsonResponse = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async (pathname: string) => {
        if (!pathname.startsWith(prefix)) {
          throw new ValidationError(`Upload path must start with "${prefix}"`);
        }
        return {
          allowedContentTypes: ALLOWED_IMAGE_CONTENT_TYPES,
          maximumSizeInBytes: MAX_IMAGE_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Log only — the DB is updated by the client's follow-up PUT, not here.
        console.log(`[blob] upload completed: ${blob.url}`);
      },
    });
    res.json(jsonResponse);
  });
}
