# Provenance Tracking

Sprocket automatically tracks all workflow executions in a SQLite database while
maintaining an organized filesystem structure for outputs. Both `sprocket run`
and `sprocket server` share the same execution engine and output structure, so
the concepts described here apply equally to both commands. For design details,
see [RFC #3](https://github.com/stjude-rust-labs/rfcs/pull/3).

## Runs and indexes

The output directory contains two complementary directory hierarchies that
together address a fundamental tension in workflow management: users need both a
complete provenance record for reproducibility and auditing _and_ a simplified,
domain-specific view for everyday access to results. Rather than forcing users to
choose one or maintain both manually, Sprocket provides both automatically.

The **`runs/`** directory is the immutable record of truth. It organizes every
execution chronologically by target name and timestamp, preserving the full
history of inputs, outputs, and individual task attempts. This structure is
append-only---Sprocket never modifies or removes previous runs---so it serves as
a reliable audit trail. When a workflow is run multiple times, each execution
receives its own timestamped directory, and the complete set of attempts is
always available for inspection.

The **`index/`** directory is an optional, user-curated view layered on top of
the runs. When the `--index-on` flag is provided, Sprocket creates symlinks
under `index/` that point back into `runs/`, giving users a way to organize
results by whatever dimension makes sense for their domain (e.g., by project, by
sample, by analysis type) without duplicating any data. Because the index
consists entirely of relative symlinks, it adds negligible storage overhead and
can be reconstructed from the provenance database at any time.

This separation means that the provenance record remains intact regardless of how
the index evolves. Re-running a workflow with the same `--index-on` path updates
the index symlinks to point to the latest results, but the previous run's
directory under `runs/` is preserved, and the database records the full history
of index changes. The design follows a principle of
[progressive disclosure](https://en.wikipedia.org/wiki/Progressive_disclosure):
users who simply run `sprocket run` get a well-organized `runs/` directory and a
provenance database with no extra configuration, and those who need logical
organization can opt into indexing by adding a single flag.

## Output directory

By default, Sprocket creates an `out/` directory in your current working
directory to store all workflow outputs and provenance data. This location can
be configured via:

- The `-o, --output-dir` CLI flag (for `sprocket run`).
- The `-o, --output-directory` CLI flag (for `sprocket server`).
- The `run.output_dir` configuration option (for run mode).
- The `server.output_directory` configuration option (for server mode).

### Directory structure

```
./out/
├── sprocket.db                       # SQLite provenance database
├── output.log                        # Execution log
├── runs/                             # Execution directories
│   └── <target>/                     # Target-specific directory
│       ├── <timestamp>/              # Individual run (YYYY-MM-DD_HHMMSSffffff)
│       │   ├── inputs.json           # Serialized inputs for the run
│       │   ├── outputs.json          # Serialized outputs from the run
│       │   └── attempts/             # Task execution attempts
│       │       └── <n>/              # Attempt number (0, 1, 2, ...)
│       │           ├── command       # Executed shell script
│       │           ├── stdout        # Task standard output
│       │           └── stderr        # Task standard error
│       └── _latest -> <timestamp>/   # Symlink to most recent run
└── index/                            # Optional output indexing
    └── <output_name>/                # Indexed output name
        └── outputs.json              # Symlink to run outputs
```

### The `_latest` symlink

For each target, Sprocket maintains a `_latest` symlink pointing to the most
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

## Run contents

Each run creates a timestamped directory under `runs/<target>/` containing
the following:

| File/Directory | Description |
|----------------|-------------|
| `inputs.json` | Serialized inputs provided for the run |
| `outputs.json` | Serialized outputs produced by the run |
| `attempts/` | Directory containing attempt subdirectories |
| `attempts/<n>/command` | The shell script that was executed |
| `attempts/<n>/stdout` | Standard output from the task |
| `attempts/<n>/stderr` | Standard error from the task |

### Retries

When a task fails and is retried, each attempt gets its own numbered
subdirectory under `attempts/`. This preserves the complete history of all
execution attempts, which is valuable for debugging intermittent failures.

## Output indexing

When the `--index-on` flag is provided, Sprocket indexes run outputs by the
specified output name. For each run, a symlink is created under
`index/<output_name>/` pointing to the run's `outputs.json` file. This enables
efficient lookup of runs by output values without scanning the entire `runs/`
directory.

```shell
# Run a workflow with output indexing on the `greeting` output
sprocket run hello.wdl -t hello --index-on greeting
```

The resulting index entry is a relative symlink:

```
index/greeting/outputs.json -> ../../runs/hello/<timestamp>/outputs.json
```

## Portability

The entire output directory is designed to be portable:

- All paths stored in the database are relative to the database file.
- Symlinks (including index entries) use relative paths.
- Moving the `out/` directory with `mv` or `rsync` preserves all relationships.

## Concurrent access

Both `sprocket run` and `sprocket server` share the same execution engine and
can operate on the same output directory simultaneously:

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
