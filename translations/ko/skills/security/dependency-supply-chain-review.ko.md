# Dependency Supply Chain Review

dependency, SBOM, license, provenance 변경을 위한 primary security skill입니다.

## Workflow

1. package manager, lockfile, runtime artifact, container image, generated code, release gate를 확인합니다.
2. direct/transitive dependency 영향, license obligation, vulnerability exploitability, runtime exposure를 비교합니다.
3. Generic package advice보다 SBOM/provenance evidence와 repository-defined audit command를 우선합니다.
4. Lockfile consistency, test/build, license policy, vulnerability scan output, rollback/update note를 검증합니다.

## Reference

package 추가/update, lockfile 변경, CVE review, release compliance evidence 준비 전 `references/dependency-supply-chain-checklist.md`를 읽습니다.
