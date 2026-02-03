# Provenance Tracking

Sprocket automatically tracks all workflow executions in a SQLite database while
maintaining an organized filesystem structure for outputs. This provides both
auditability through complete execution history and usability through logical
organization. For design details, see [RFC #3](https://github.com/stjude-rust-labs/rfcs/pull/3).

## Output directory

By default, Sprocket creates an `out/` directory in your current working
directory to store all workflow outputs and provenance data. This location can
be configured via:

- The `--output-directory` CLI flag.
- The `server.output_directory` configuration option (for server mode).

### Directory structure

```
./out/
├── sprocket.db                       # SQLite provenance database
├── sprocket.db-shm                   # SQLite shared memory (WAL mode)
├── sprocket.db-wal                   # SQLite write-ahead log
├── runs/                             # Workflow execution directories
│   └── <workflow_name>/              # Workflow-specific directory
│       ├── <timestamp>/              # Individual run (YYYY-MM-DD_HHMMSSffffff)
│       │   └── calls/                # Task execution directories
│       │       └── <task_call_id>/   # Task identifier
│       │           ├── attempts/     # Retry attempts directory
│       │           │   └── <n>/      # Attempt number (0, 1, 2, ...)
│       │           │       ├── command   # Executed shell script
│       │           │       ├── stdout    # Task standard output
│       │           │       ├── stderr    # Task standard error
│       │           │       └── work/     # Task working directory
│       │           └── tmp/          # Temporary localization files
│       └── _latest -> <timestamp>/   # Symlink to most recent run
└── index/                            # Optional symlinked organization
```

### The `_latest` symlink

For each workflow, Sprocket maintains a `_latest` symlink pointing to the most
recent execution directory. This provides quick access to the latest results
without needing to know the exact timestamp.

```shell
# Access the latest run outputs
ls out/runs/my_workflow/_latest/
```

> [!NOTE]
>
> On Windows, creating symlinks may require administrator privileges or
> Developer Mode. If symlink creation fails, the `_latest` symlink will be
> omitted but workflow execution will continue normally.

## Provenance database

The `sprocket.db` SQLite database tracks all workflow executions, including:

- **Sessions**: Groups of related workflow submissions.
- **Runs**: Individual workflow executions with inputs, outputs, and status.
- **Tasks**: Individual task executions within a workflow run.

## Portability

The entire output directory is designed to be portable:

- All paths stored in the database are relative to the database file.
- Symlinks use relative paths.
- Moving the `out/` directory with `mv` or `rsync` preserves all relationships.

## Execution directories

Each workflow execution creates a timestamped directory under
`runs/<workflow_name>/`. Within this directory:

### Task execution

Each task call creates a directory containing:

| File/Directory | Description |
|----------------|-------------|
| `attempts/` | Directory containing attempt subdirectories |
| `attempts/<n>/command` | The shell script that was executed |
| `attempts/<n>/stdout` | Standard output from the task |
| `attempts/<n>/stderr` | Standard error from the task |
| `attempts/<n>/work/` | Working directory containing output files |
| `tmp/` | Temporary files used during input localization |

### Retries

When a task fails and is retried, each attempt gets its own numbered
subdirectory under `attempts/`. This preserves the complete history of all
execution attempts, which is valuable for debugging intermittent failures.

## Concurrent access

Both `sprocket run` and `sprocket server` can operate on the same output
directory simultaneously:

- The SQLite WAL mode enables concurrent access.
- Database locks are held briefly (milliseconds per transaction).
- A workflow submitted via CLI is immediately visible to the server.
- All workflows share the same database regardless of submission method.

## Best practices

1. **Use a dedicated output directory** for each project to keep provenance
   isolated
2. **Back up the output directory** regularly to preserve execution history
3. **Don't modify files directly** in the `runs/` directory as this may
   invalidate provenance records
4. **Use the API or database** to query execution history rather than parsing
   directory structures directly
