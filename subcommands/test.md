# `sprocket dev test`

> [!CAUTION]
> 
> This document describes the beta release of the `test` command,
> which is currently exposed under the `dev` subcommand (i.e. `sprocket dev
> test`). This functionality may change in future releases.

The Sprocket unit testing framework does not require any modifications to your source WDL, re-uses your `run` configuration, and everything required to test is done via YAML. The framework has been designed to get up and running with comprehensive unit tests as quickly and easily as possible.

## How to write unit tests

Unit tests are written in YAML and stored alongside the WDL source.

### Where test definitions are located

Tests are defined separately from the WDL, in standalone YAML files. These YAML files need to have the same basename as the source WDL document, up to the trailing `.wdl` extension which should be replaced with either a `.yaml` or `.yml` file extension.

These YAML files must be located either "sibling" to their source WDL or nested under a `test/` folder in the same directory. For example:

```text
wdl_source/
├── data_structures
│   ├── flag_filter.wdl
│   ├── flag_filter.yml
│   ├── read_group.wdl
│   ├── test
│   │   └── read_group.yaml
│   └── untested_source.wdl
└── other_source
```

### What test YAML looks like

The root of each YAML file should be populated with a YAML mapping of exact matches to the names of any WDL tasks or workflows defined in the corresponding WDL source. Each entrypoint (task or workflow) can appear up to once in the root, but may have any number of tests associated with it. Tests are defined as a sequence beneath the entrypoint name where sequence elements are delimited with a hyphen (`-`) and each test must have a `name: <your test name here>`. Inputs are defined as a mapping of WDL input names to sequences of values. Inputs must be specified as sequences, even if the sequence only contains one element; if the sequence has multiple elements, they will be combinatorially expanded with all the other input sequences. This is referred to as an "input matrix" and allows for a large number of individual WDL executions to be run as a single test. For example:

```yaml
bam_to_fastq:
  - name: kitchen_sink
    inputs:
      bam:
        - bams/Aligned.sortedByCoord.chr9_chr22.bam
        - bams/test_rnaseq_variant.bam
        - bams/test.bwa_aln_pe.chrY_chrM.bam
      bitwise_filter:
        - include_if_all: "0x0"
          exclude_if_any: "0x900"
          include_if_any: "0x0"
          exclude_if_all: "0x0"
        - include_if_all: "00"
          exclude_if_any: "0x904"
          include_if_any: "3"
          exclude_if_all: "0"
      paired_end:
        - true
        - false
      retain_collated_bam:
        - true
        - false
      append_read_number:
        - true
        - false
      output_singletons:
        - true
        - false
      prefix:
        - kitchen_sink_test
```

This is a single test named "kitchen_sink" which defines an input matrix that gets expanded into 96 individual WDL executions, all of which have a unique set of inputs and run in parallel!

> 96 executions come from the cartesian product of each sequence inputs (`3*2*2*2*2*2*1=96`).

If not otherwise specified, a test is considered successful so long as the entrypoint runs to completion, exits without an error, and all outputs are evaluated successfully. For tasks, the test framework assumes the expected exit code is `0`.

Fail conditions can be tested by specifying an `assertions:` section for the YAML definition. The assertions available depend on whether the entrypoint is a task or a workflow. At the time of writing, the only assertion available for workflows is `should_fail: <boolean>`. This defaults to `false`, but may be specified as `should_fail: true`, which will invert expectations. The `should_fail` assertion is ignored for task executions. To unit test a fail case for a task entrypoint, a non-zero `exit_code: <integer>` should be specified.

```yaml
validate_string_is_12bit_int: # this is a task
  - name: valid_numbers
    inputs:
      number:
        - "5" # decimal
        - "0x9AF" # hexadecimal
        - "01" # octal
        - "4095" # decimal
  - name: invalid_numbers
    inputs:
      number:
        - "0x1000" # too many bits
        - ""
        - string
        - this is not a number
        - "000000000011" # too many bits (interpreted as octal, not binary)
        - "-1" # only unsigned ints are accepted
        - "+1"
    assertions:
      exit_code: 42
validate_flag_filter: # this is a workflow
  - name: valid_FlagFilter
    inputs:
      flags:
        - include_if_all: "3"
          exclude_if_any: "0xF04"
          include_if_any: "03"
          exclude_if_all: "4095"
  - name: invalid_FlagFilter
    inputs:
      flags:
        - include_if_all: "3"
          exclude_if_any: "0xF04"
          include_if_any: "03"
          exclude_if_all: "whoops! I'll trigger a fail :("
    assertions:
      should_fail: true
```

Assertions are shared by all executions of a test. In the example above, there are 4 executions defined for the `validate_string_is_12bit_int::valid_numbers` test. This test is considered passed if all 4 of those executions evaluate with an exit code of `0`. The `invalid_numbers` test contains 7 executions, and every one of those executions must exit with a code of `42` for the test to be considered a success.

At the time of writing, the only other assertions available for tasks are the `stdout` and `stderr` assertions. Both of these work very similarly; they expect a YAML sequence of strings that are interpreted as [regular expressions](https://en.wikipedia.org/wiki/Regular_expression) which should match on the task's STDOUT/STDERR stream. For example:

```yaml
validate_string_is_12bit_int:
  - name: too_big_decimal_fails
    inputs:
      number:
        - "4096"
        - "10000"
        - "9999"
    assertions:
      exit_code: 42
      stderr:
        - Input number \(.*\) interpreted as decimal
        - But number must be less than 4096!
```

### How to use test fixtures

WDL tasks and workflows often take file inputs, so the Sprocket unit testing framework has attempted to make it as easy as possible to reference "test fixtures" from test YAML.

Fixtures are located relative to a WDL workspace's root, at `<workspace>/test/fixtures/`. A WDL workspace is very similar to a git repository (a directory can be both a WDL workspace and a git repository), in that it is simply a directory on your local filesystem with a collection of WDL documents within it. These WDL documents can be arbitrarily nested and Sprocket will recursively search the workspace for all files with a `.wdl` extension and an associated YAML file. The `test/fixtures/` directory will always be loaded as the "origin" from which all files are expected to be located. This means that your test YAML can live near the WDL source it is testing, but test fixtures remain isolated relative to the workspace root, preventing clutter in your source directories.

Let's return to the "kitchen_sink" example test defined earlier: one of the inputs sections looks like:

```yaml
      bam:
        - bams/Aligned.sortedByCoord.chr9_chr22.bam
        - bams/test_rnaseq_variant.bam
        - bams/test.bwa_aln_pe.chrY_chrM.bam
```

Regardless of where this YAML file is located in the workspace, the 3 BAM files referenced will be found at:

```text
<workspace>/test/fixtures/bams/Aligned.sortedByCoord.chr9_chr22.bam
<workspace>/test/fixtures/bams/test_rnaseq_variant.bam
<workspace>/test/fixtures/bams/test.bwa_aln_pe.chrY_chrM.bam
```

This makes re-using test fixtures across your workspace super easy! Any YAML file in the workspace can reference the same fixtures using the same paths; even if the source WDL moves around, your tests will remain valid.

### Specifying groups of inputs

Often in bioinformatics, files have separate accessory files that are specific to each other. If these files are provided as distinct inputs, the combinatorial nature of input matrices may mix up these files and cause unintended errors. For example, the following test definition would not produce a useful test matrix:

```yaml
bam_coverage:
  - name: this_will_not_work
    inputs:
      bam:
        - bams/test.bam
        - bams/test.bwa_aln_pe.chrY_chrM.bam
        - bams/Aligned.sortedByCoord.chr9_chr22.bam
        - bams/test_rnaseq_variant.bam
      bam_index:
        - bams/test.bam.bai
        - bams/test.bwa_aln_pe.chrY_chrM.bam.bai
        - bams/Aligned.sortedByCoord.chr9_chr22.bam.bai
        - bams/test_rnaseq_variant.bam.bai
      prefix:
        - test_bigwig
```

The problem is that in addition to the correct inputs we want to test (e.g. `bam=bams/test.bam`, `bam_index=bams/test.bam.bai`, and `prefix=test_bigwig`) there will be incorrect file combinations that will fail (e.g. `bam=test_rnaseq_variant.bam`, `bam_index=test.bwa_aln_pe.chrY_chrM.bam.bai`, and `prefix=test_bigwig`).

Groups of inputs that should be combined exactly can be specified with a special syntax that involves nesting the input keys under a key starting with a dollar sign (`$`). The identifier that follows the dollar sign is unimportant and can be any non-empty string. To fix our test definition, we could re-write to look like:

```yaml
bam_coverage:
  - name: this_will_work
    inputs:
      $samples:
        bam:
          - bams/test.bam
          - bams/test.bwa_aln_pe.chrY_chrM.bam
          - bams/Aligned.sortedByCoord.chr9_chr22.bam
          - bams/test_rnaseq_variant.bam
        bam_index:
          - bams/test.bam.bai
          - bams/test.bwa_aln_pe.chrY_chrM.bam.bai
          - bams/Aligned.sortedByCoord.chr9_chr22.bam.bai
          - bams/test_rnaseq_variant.bam.bai
      prefix:
        - test_bigwig
```

Now, instead of creating a matrix with 16 executions (12 of which would fail), we are only defining 4 executions, all of which should succeed.

### Tagging tests

It's often helpful to run only a subset of tests defined in a workspace, either by excluding slow tests or by only running the tests you are actively developing. Each test can include a sequence of tags that can be toggled from the command line when executing tests. For example:

```yaml
build_bwa_db:
  - name: build_reference
    tags: [ reference, slow ]
    inputs:
      reference_fasta:
        - reference/GRCh38.chrY_chrM.fa
```

## Running unit tests

```text
Usage: sprocket dev test [OPTIONS] [SOURCE]

Arguments:
  [SOURCE]
          Local path to a WDL document or workspace to unit test.

          If not specified, this defaults to the current working directory.

Options:
  -w, --workspace <WORKSPACE>
          Root of the workspace where the `test/` directory will be located. Test fixtures will be loaded from `<workspace>/test/fixtures/` if it is present.

          If a `<workspace>/test/` directory does not exist, one will be created and it will contain a `runs/` directory for test executions.

          If not specified and the `source` argument is a directory, it's assumed that directory is also the workspace. This can be specified in addition to a source directory if they are different.

          If not specified and the `source` argument is a file, it's assumed that the current working directory is the workspace. This can be specified in addition to a source file if the CWD is not the right workspace.

  -t, --include-tag <TAG>
          Specific test tag that should be run.

          Can be repeated multiple times.

  -f, --filter-tag <TAG>
          Filter out any tests with a matching tag.

          Can be repeated multiple times.

      --no-clean
          Do not clean the file system of successful tests.

          The default behavior is to remove directories of successful tests, leaving only failed and errored run directories on the file system.

      --clean-all
          Clean all exectuion directories, even for tests that failed or errored
```
