# Container Image Change

## Inventory

- Image source: Dockerfile, generated image recipe, buildpack, base image, language runtime image, or CI build step.
- Build context: included files, `.dockerignore`, generated assets, secrets, cache mounts, and copied dependency manifests.
- Runtime surface: exposed ports, entrypoint, command, user, filesystem permissions, environment variables, healthcheck, and shipped artifacts.
- Supply-chain surface: base image tag/digest, package manager commands, OS packages, curl/install scripts, provenance, SBOM, and vulnerability policy.

## Review

- Check whether the base image tag is pinned enough for the repository's release risk. Prefer digests or repository convention for release-critical images.
- Treat package manager cache, install scripts, OS packages, and downloaded binaries as supply-chain surface.
- Confirm build secrets are mounted or injected safely and are not copied into layers, logs, or final artifacts.
- Keep build-only tooling out of the runtime stage when the repository uses multi-stage builds.
- Check user permissions, writable paths, timezone/locale, certificates, and process signal handling before changing entrypoint or command.
- Compare image size and startup behavior when changing dependency installation, bundling, or runtime base.

## Verification

- Repository-defined image build or package command.
- Static Dockerfile/container lint if available.
- Dependency, SBOM, license, or vulnerability scan when the repository supports it.
- Smoke run with expected entrypoint, env shape, healthcheck, and port binding.
- Rollback note naming the previous image tag/digest or artifact source.

## Stop Conditions

- The change could expose secrets in image layers or logs.
- The new image cannot be rebuilt reproducibly enough for the release path.
- Runtime user, permission, entrypoint, or healthcheck behavior is unknown.
- The deployment requires a data migration or config change that is not covered by the container diff.
