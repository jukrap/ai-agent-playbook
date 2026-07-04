# File Transfer Boundary

Use this for legacy batch jobs, scheduled imports/exports, file drops, and partner transfers.

## Contract fields

- Producer and consumer.
- Transport: local folder, shared drive, SFTP, email attachment, object storage, or manual upload.
- Filename pattern, extension, timestamp, sequence number, and collision behavior.
- Encoding, delimiter, quote behavior, line endings, header rows, and trailer rows.
- Required columns, optional columns, default values, and column order.
- Timezone, business day, holiday, and cutoff rules.

## Runtime lifecycle

1. Detect candidate file.
2. Lock or claim the file.
3. Validate format before side effects.
4. Process records with clear success/failure accounting.
5. Archive, quarantine, or leave files in a documented state.
6. Emit logs and alerts that identify partial failures.
7. Support safe rerun or reconciliation.

## Failure modes

- Partial file read while another process is still writing.
- Duplicate file from retry or operator upload.
- Encoding mismatch that changes identifiers or names.
- Header change that shifts positional parsing.
- Timezone or holiday rule that selects the wrong business date.
- Success status even though some records failed.

## Verification set

- Valid file.
- Empty file.
- Malformed file.
- Duplicate file.
- Large file near expected production volume.
- Rerun after success.
- Rerun after partial failure.

## Recovery

Do not overwrite or delete files unless the archive/recovery path is documented. When recovery is manual, record the exact operator step and evidence needed to prove completion.
