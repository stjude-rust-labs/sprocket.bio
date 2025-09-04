# Configuration

Sprocket has a number of facilities for including, excluding, initializing, and
resolving configuration.

## Configuration load order

Configuration can be provided to Sprocket through a variety of different
channels (listed in order of the relative priority during loading).

* **Command-line arguments.** A configuration file can be specified at runtime
  on the command line using the `--config` argument.
* **Environment variables.** The path to a configuration file can be specified
  via the `SPROCKET_CONFIG` environment variable.
* **Current working directory.** Sprocket will attempt to load a `sprocket.toml`
  within the current working directory when the `sprocket` command runs.
* **System-wide configuration locations.** See [the section
  below](#system-wide-configuration-locations) on how to use the system-wide
  configuration directory.

# System-wide configuration locations

| Platform | Value                                                                                            | Example                              |
|----------|--------------------------------------------------------------------------------------------------|--------------------------------------|
| Linux    | `$XDG_CONFIG_HOME/sprocket.toml` (if `$XDG_CONFIG_HOME` is set) or `$HOME/.config/sprocket.toml` | `/home/alice/.config/sprocket.toml`  |
| macOS    | `$HOME/.config/sprocket.toml`                                                                    | `/Users/alice/.config/sprocket.toml` |
| Windows  | `%USERPROFILE%\AppData\Roaming\sprocket.toml`                                                    | `C:\\Users\alice\AppData\Roaming`    |

## Resolving effective configuration

To determine how your configuration resolves in your current environment, you can use
the `sprocket config resolve` to print it. The default configuration can be written out
using the `sprocket config init` command.

## Incremental application

Configuration values are _incrementally_ applied, meaning that configuration values
loaded later in the configuration loading process take priority over those loaded
earlier. This means that:

- Single-value configuration settings are overwritten, and
- Lists of configuration values are appended.

As an example, consider specifying the following configuration file in your current
working directory.

```toml
[format]
indentation_size = 5

[check]
except = ['ContainerUri']
```

And the following in a configuration file pointed to by the `$SPROCKET_CONFIG`
environment variable.

```toml
[format]
indentation_size = 3

[check]
except = ['SnakeCase']
```

The configuration provided by `$SPROCKET_CONFIG` would take priority over the
configuration in your home directory (as defined in the list at the top of this guide),
leaving you with the following final configuration.

```toml
[format]
# Because this is a single-value configuration setting, the value provided in 
# your home directory is overwritten by the one in provided in 
# `$SPROCKET_CONFIG`.
indentation_size = 3

[check]
# Because this is a list configuration setting, the values provided in 
# `$SPROCKET_CONFIG` are appended to those provided in your home directory.
except = ['ContainerUri', 'SnakeCase']
```

## Skipping configuration search

Configuration resolution can be disabled by passing the `--skip-config-search` option on
the command line. This will disable the searching for and loading of configuration
files. The only configuration loaded will be that (if) specified by the `--config`
command line argument.

## Ignoring WDL files and directories

Sprocket is able to parse `.sprocketignore` files found in the current working
directory, its parent directories, and its child directories. The syntax and semantics
of these "ignorefiles" are similar to `.gitignore` files, except the focus is on the
discovery/inclusion of WDL files.

Each line of the ignorefile represents a path or glob pattern that should be ignored by
Sprocket invocations. Ignorefiles apply their path filters to the directory they are in
and any child directories, but not to their parent directory.

This is particularly useful if you have any WDL files that should not be analyzed,
checked, or documented. Note that ignorefiles only impact searching for files with the
extension `.wdl`.
