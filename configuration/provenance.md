# Provenance Tracking

Sprocket automatically tracks all workflow executions in a SQLite database while
maintaining an organized filesystem structure for outputs. Both `sprocket run`
and `sprocket server` share the same execution engine and output structure, so
the concepts described here apply equally to both commands.

> [!NOTE]
>
> Provenance is a well-established research area within scientific workflow
> systems. Formal models such as the
> [W3C PROV](https://www.w3.org/TR/prov-overview/) family and its
> workflow-oriented extension
> [ProvONE](https://purl.dataone.org/provone-v1-dev) define rich vocabularies
> for describing data lineage, activity chains, and agent relationships (cf.
> [Ludäscher et al., 2016](https://link.springer.com/chapter/10.1007/978-3-319-40226-0_7);
> [Deelman et al., 2018](https://journals.sagepub.com/doi/abs/10.1177/1094342017704893)).
> Sprocket uses the term "provenance" more loosely here to describe its
> execution tracking capabilities---recording what was run, with which inputs,
> when, and by whom---rather than implementing the full data lineage and
> dependency tracking described in those formal models.

For design details, see [RFC #3](https://github.com/stjude-rust-labs/rfcs/pull/3).

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

The layout within each run directory differs slightly depending on whether the
target is a standalone task or a workflow containing multiple task calls.

#### Task runs

When running a task directly, the `attempts/` directory sits at the top level of
the run directory.

```
./out/
├── sprocket.db                       # SQLite provenance database
├── output.log                        # Execution log
├── runs/
│   └── <target>/
│       ├── <timestamp>/              # Individual run (YYYY-MM-DD_HHMMSSffffff)
│       │   ├── inputs.json           # Serialized inputs for the run
│       │   ├── outputs.json          # Serialized outputs from the run
│       │   ├── tmp/                  # Temporary localization files
│       │   └── attempts/
│       │       └── <n>/              # Attempt number (0, 1, 2, ...)
│       │           ├── command       # Executed shell script
│       │           ├── stdout        # Task standard output
│       │           ├── stderr        # Task standard error
│       │           └── work/         # Task working directory
│       └── _latest -> <timestamp>/   # Symlink to most recent run
└── index/                            # Optional output indexing
    └── <output_name>/
        └── outputs.json              # Symlink to run outputs
```

#### Workflow runs

When running a workflow, each task call within the workflow gets its own
subdirectory under `calls/`. Each call directory then contains the same
`attempts/` and `tmp/` structure as a standalone task run.

```
./out/
├── sprocket.db
├── output.log
├── runs/
│   └── <target>/
│       ├── <timestamp>/
│       │   ├── inputs.json
│       │   ├── outputs.json
│       │   ├── tmp/                  # Workflow-level temporary files
│       │   └── calls/               # Task execution directories
│       │       └── <task_call_id>/   # One per task call in the workflow
│       │           ├── tmp/          # Task-level temporary files
│       │           └── attempts/
│       │               └── <n>/
│       │                   ├── command
│       │                   ├── stdout
│       │                   ├── stderr
│       │                   └── work/
│       └── _latest -> <timestamp>/
└── index/
    └── <output_name>/
        └── outputs.json
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
| `tmp/` | Temporary files used during input localization |
| `attempts/` | Directory containing attempt subdirectories (task runs) |
| `calls/` | Directory containing per-task-call subdirectories (workflow runs) |
| `attempts/<n>/command` | The shell script that was executed |
| `attempts/<n>/stdout` | Standard output from the task |
| `attempts/<n>/stderr` | Standard error from the task |
| `attempts/<n>/work/` | Task working directory containing output files |

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

### Organizing output directories

Use a dedicated output directory for each project or analysis domain. This keeps
provenance data isolated, makes backups straightforward, and avoids confusion
when multiple unrelated workflows share the same `runs/` hierarchy.

```shell
sprocket run pipeline_a.wdl -o ./pipeline-a-out ...
sprocket run pipeline_b.wdl -o ./pipeline-b-out ...
```

### Querying execution history

The REST API (available via `sprocket server`) is the recommended way to query
execution history. The API provides endpoints for listing sessions, runs, and
tasks with filtering capabilities. See the
[server documentation](/subcommands/server) for endpoint details and the
interactive Swagger UI at `/api/v1/swagger-ui` for exploration.

Avoid parsing the `runs/` directory structure directly for programmatic access.
The layout within `runs/` is an implementation detail that may evolve, whereas
the API provides a stable interface. The `index/` directory, on the other hand,
is user-assembled via `--index-on` and is designed to be consumed directly.

### Backing up provenance data

The output directory is self-contained: backing up the entire `out/` directory
(including `sprocket.db` and the `runs/` and `index/` hierarchies) captures the
full provenance record. Because all paths in the database and all symlinks are
relative, a backup can be restored to any location without reconfiguration.

When backing up a live system, be aware that SQLite WAL mode uses auxiliary
files (`sprocket.db-wal` and `sprocket.db-shm`). For a consistent backup,
either stop active workflows first, or use SQLite's
[backup API](https://www.sqlite.org/backup.html) to safely copy the database
while it is in use.

### Preserving the `runs/` directory

The `runs/` hierarchy is the immutable record of truth for all workflow
executions. Do not modify, rename, or delete files within it, as doing so may
invalidate provenance records and break index symlinks that reference those
paths. If disk space becomes a concern, consider archiving older runs rather
than deleting them.
