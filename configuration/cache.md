# Call Cache

Sprocket has support for caching task execution results for later reuse when a
task is called again with the same inputs.

By reusing a cached task execution result, a previously failed workflow run can
be resumed at the point of failure without having to rerun every task that
previously succeeded.

## Enabling the call cache

By default, the use of the call cache is disabled (i.e. `off`).

To enable Sprocket to use the call cache, add the following to your `sprocket.toml` file:

```toml
[run.task]
cache = "on"
```

The `on` setting makes all tasks eligible for caching by default unless a task
is hinted as being _not_ [`cacheable`](#the-cacheable-hint).

Additionally, the call cache supports an `explicit` mode where only the tasks
explicitly hinted as being [`cacheable`](#the-cacheable-hint) are eligible for
caching.

To enable this mode, add the following to your `sprocket.toml`:

```toml
[run.task]
cache = "explicit"
```

::: tip Note
A task's execution must succeed on the very first attempt for it to be eligible
for the cache.

If the task's execution is retried by Sprocket, the resulting task execution
will not be cached even if it succeeds.
:::

## Call cache directory

By default, the call cache is maintained in a directory based upon the user's
operating system:

|Platform | Default Call Cache Directory                                        | Example                                                 |
| ------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| Linux   | `$XDG_CONFIG_HOME/sprocket/calls` or `$HOME/.config/sprocket/calls` | /home/alice/.config/sprocket/calls                      |
| macOS   | `$HOME/Library/Application Support/sprocket/calls`                  | /Users/Alice/Library/Application Support/sprocket/calls |
| Windows | `%AppData%/sprocket/calls`                                          | C:\Users\Alice\AppData\Roaming\sprocket\calls           |

The location of the call cache directory can be modified by adding the
following to your `sprocket.toml`:

```toml
[run.task]
cache_dir = "<path-to-cache>"
```

## The `cacheable` hint

When call caching is set to `on` in your `sprocket.toml`, all tasks will be
eligible for caching by default.

To opt-out of caching for a specific task, set the `cacheable` hint to `false`:

```wdl
hints {
    cacheable: false
}
```

When call caching is set to `explicit` in your `sprocket.toml`, no task will be
eligible for caching by default.

To opt-in to caching a specific task, set the `cacheable` hint to `true`:

```wdl
hints {
    cacheable: true
}
```

For WDL versions before 1.2, substitute the `runtime` section in lieu of the
`hints` section above.

## Disabling the call cache for a run

The call cache can be disabled for a specific invocation of `sprocket run` by
specifying the `--no-call-cache` option:

```bash
$ sprocket run --no-call-cache ...
```

## Call cache lookup

A call cache entry is looked up with the following:

* The URI to the document containing the task.
* The name of the task.
* The evaluated _values_ of the task's `input` section.

If any of the above change, Sprocket will report it as a _cache miss_ if it
hasn't seen that specific combination before.

## Call cache invalidation

Additionally, a call cache entry is _invalidated_ if any of the following are
modified:

* The evaluated `command` of the task.
* The `container` used by the task, either from the `requirements` section of
  the task or the default used by Sprocket.
* The `shell` used by the task, either from `sprocket.toml` or the default used
  by Sprocket.
* The evaluated `requirements` section of the task (WDL 1.2+).
* The evaluated `hints` section of the task (WDL 1.2+).
* The evaluated `runtime` section of the task (WDL < 1.2).
* The _content_ of the `File` and `Directory` inputs to the task.

A call cache entry points at the location of the previously successful run,
specifically:

* The location of the `stdout` file from the task's execution.
* The location of the `stderr` file from the task's execution.
* The location of the working directory from the task's execution.

As a result, if the run directory of the cache entry no longer exists (or is
modified), the cache entry is _invalidated_.

Sprocket will log a message indicating which of the above have been modified
when it detects a change.

::: warning Warning
The call cache will not detect changes to the _image_ used for the task's
execution.

If the `container` requirement of the task is _mutable_ (i.e. it uses a
_mutable_ tag), the image associated with that tag may change and not cause a
call cache entry to be invalidated.
:::

## Logged messages

Sprocket will log an `INFO` level message indicating when it reuses or
invalidates a call cache entry.

Use the `-v` option to Sprocket to enable the output of these messages.
