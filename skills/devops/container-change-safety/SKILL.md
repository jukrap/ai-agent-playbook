---
name: container-change-safety
description: Use when changing Dockerfiles, container images, Compose or Kubernetes manifests, service runtime config, healthchecks, volumes, networks, or containerized deployment behavior.
---

# Container Change Safety

Use this as the primary DevOps skill for container image and container runtime changes.

## Workflow

1. Identify the changed image, build context, runtime manifest, service boundary, environment, secret, volume, network, and healthcheck surface.
2. Separate build-time risk from runtime/deployment risk, and check whether the change affects rollback compatibility.
3. Prefer repository-defined build, scan, deploy preview, and smoke-test commands over generic container advice.
4. Verify the image or manifest with the narrowest reliable build/check plus runtime logs or health signals when available.

## Reference

Read `references/container-image-change.md` for Dockerfile/image changes.

Read `references/compose-kubernetes-change.md` for Compose, Kubernetes, service runtime, volume, network, and healthcheck changes.
