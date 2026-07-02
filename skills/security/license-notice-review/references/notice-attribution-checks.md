# Notice Attribution Checks

Use this when NOTICE, attribution, or copied material may need to ship with an artifact.

## Notice Surface

- License and NOTICE files in the repository root and in package/artifact output.
- Third-party notices for vendored code, bundled assets, fonts, icons, generated code, templates, examples, datasets, and binary dependencies.
- Package metadata, app store metadata, marketplace descriptions, documentation, and downloadable bundles.

## Checks

- Confirm required attribution remains visible in the artifact or documentation location expected by the project.
- Compare package include/exclude rules against required license and notice files.
- Check copied snippets, generated files, and bundled assets for source and license annotations when needed.
- Keep notice updates in the same change as the dependency, asset, package, or artifact change that requires them.

## Stop Conditions

- Required notice or license files are missing from the shipped artifact.
- A vendored or generated file has unknown provenance.
- A copied snippet or asset has unclear permission or attribution requirements.
- The change widens redistribution scope without policy review.
