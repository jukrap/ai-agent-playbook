import { createRestProvider } from './github.mjs';

/**
 * Create a Gitea v1 public API provider. The transport is expected to prepend
 * the server's discovered `/api/v1` base URL; only stable repository endpoints
 * are emitted here.
 *
 * @param {{transport: {request(request: object): Promise<unknown>}, repository: {owner: string, name: string}}} options
 */
export function createGiteaProvider(options) {
  return createRestProvider({
    ...options,
    provider: 'gitea',
    labelsAsIds: true,
    pageSizeParameter: 'limit',
    milestoneIdentity: (milestone) => milestone?.id,
    headers: {
      accept: 'application/json'
    }
  });
}
