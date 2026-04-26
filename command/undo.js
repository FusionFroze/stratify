import chalk from "chalk";
import Conf from "conf";
import path from "node:path";
import fs from "node:fs";

const conf = new Conf({ projectName: "stratify" });

export default async function undo() {
  const recordHistory = conf.get();
  const recordHistoryKeys = Object.keys(recordHistory);

  const currentWorkingDirectory = process.cwd().split(path.sep).join("/");

  if (
    recordHistoryKeys.length === 0 ||
    !recordHistoryKeys.includes(currentWorkingDirectory)
  ) {
    console.error(
      chalk.red(
        `This directory has not been organized by ${chalk.white.bold("stratify")}.\nRun ${chalk.white("stratify --help")} for usage information.`,
      ),
    );
    process.exit(1);
  }

  const dirToBeReversed = recordHistory[currentWorkingDirectory];

  let errorRecords = [];
  let modifiedFiles = [];

  const foldersToBeDeleted = [
    ...new Set(dirToBeReversed.map((r) => r.to.split(path.sep)[0])),
  ];

  while (dirToBeReversed.length > 0) {
    const file = dirToBeReversed.pop();

    try {
      await fs.promises.access(file.from);

      modifiedFiles.push(file);
      errorRecords.push({ path: file.to, code: "conflict" });

      continue;
    } catch {
      try {
        await fs.promises.rename(file.to, file.from);
      } catch (err) {
        errorRecords.push(err);
        modifiedFiles.push(file);
      }
    }
  }

  for (const folder of foldersToBeDeleted) {
    let subfolders = await fs.promises.readdir(folder);

    for (const f of subfolders) {
      const stats = await fs.promises.stat(path.join(folder, f));

      let remainingFiles;
      if (stats.isDirectory()) {
        remainingFiles = await fs.promises.readdir(path.join(folder, f));
      } else {
        continue;
      }

      if (remainingFiles.length === 0) {
        await fs.promises.rm(path.join(folder, f), {
          recursive: true,
          force: true,
        });
      }
    }

    subfolders = await fs.promises.readdir(folder);

    if (subfolders.length === 0) {
      await fs.promises.rm(folder, {
        recursive: true,
        force: true,
      });
    }
  }

  if (errorRecords.length > 0) {
    let i = 1;
    console.log(
      chalk.green(
        "Done! Everything is back where it was, with the following exceptions -\n",
      ),
    );

    for (const error of errorRecords) {
      if (error.code === "ENOENT") {
        console.log(
          `${chalk.bold(i++)}. ${chalk.red("MISSING: ")}` + error.path,
        );
      } else if (error.code === "conflict") {
        console.log(
          `${chalk.bold(i++)}. ${chalk.red("CONFLICT: ")}` + error.path,
        );
      } else {
        console.log(
          `${chalk.bold(i++)}. ${chalk.red("UNKNOWN ERROR: ")}${error.code} - ${error.path}`,
        );
      }
    }

    console.log(
      "\nYou can fix these errors by renaming or moving, and then run the 'undo' command again.",
    );

    conf.set(currentWorkingDirectory, modifiedFiles);
  } else {
    console.log(chalk.green("Done! Everything is back where it was."));

    conf.delete(currentWorkingDirectory);
  }
}
