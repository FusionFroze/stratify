# STRATIFY

Organize a messy, unorganized directory by time period.

## Installation

**Prerequisite:** Node.js v18+

```shell
$ npm i -g @fusionfroze/stratify
```

## How to Use it

First, traverse to the directory you want to organize in your terminal.

### Simulating the final structure

```shell
$ stratify --dry month
```

You also have **_quarter_** and **_year_** as options.

This command will show you which file goes where, printing the final structure without actually moving files.

**_It's always recommended to simulate the command before running it._**

### Organizing a directory

**Important:** These commands move actual files, so you should simulate the effect of the commands first.

Command structure -

```shell
$ stratify month
```

Or, whatever time period you want to organize the directory with.

This will organize the whole directory by the time period you ran the command with.

### Restoring the initial structure

After organizing a directory with the previous command, you can revert the file structure to its initial state by running this command -

```shell
$ stratify undo
```

### Clearing history

You can also delete the history of an organized directory by running this command -

```shell
$ stratify clear
```

**Important:** If you delete the history of an organized directory, the _undo_ command will not work in this directory.

_(You will be asked for confirmation once before actually deleting the history)_
