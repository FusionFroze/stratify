import fs from "node:fs";
import path from "node:path";
import { mimeTypes } from "./mime.js";
import chalk from "chalk";
import Conf from "conf";
import yoctoSpinner from "yocto-spinner";

const conf = new Conf({ projectName: "stratify" });

export default async function execute(time_period, dry) {
  const recordHistory = conf.get();
  const recordHistoryKeys = Object.keys(recordHistory);

  const currentWorkingDirectory = process.cwd().split(path.sep).join("/");

  if (
    recordHistoryKeys.length > 0 &&
    recordHistoryKeys.includes(currentWorkingDirectory)
  ) {
    console.error(
      chalk.red(
        `This directory has already been organized.\nRun ${chalk.white.bold("stratify undo")} first.`,
      ),
    );

    process.exit(1);
  }

  const files = await fs.promises.readdir("./");

  function generatePathToBeCreated(folder, fileType) {
    let i = 1;

    while (files.includes(folder)) {
      folder = folder + ` (${i++})`;
    }

    return [path.join(folder, fileType), folder];
  }

  let logRecord = [];
  let dryRunRecord = {};

  const spinner = yoctoSpinner({
    text: "Organizing your directory...",
  }).start();

  for (const file of files) {
    const stats = await fs.promises.stat(file);

    const fileExtension = path.extname(file);

    let fileType;

    if (stats.isDirectory()) {
      fileType = "Folders";
    } else {
      fileType = mimeTypes[fileExtension] || "Unknown file types";
    }

    const fileCreationTime = {};
    fileCreationTime.year = stats.birthtime.toLocaleString("default", {
      year: "numeric",
    });
    fileCreationTime.month = stats.birthtime.toLocaleString("default", {
      month: "short",
    });
    fileCreationTime.monthIndex = stats.birthtime.getMonth();

    let layerOneFolder;
    let pathToBeCreated;

    switch (time_period) {
      case "month":
        layerOneFolder = `${fileCreationTime.year}-${fileCreationTime.month}`;

        [pathToBeCreated, layerOneFolder] = generatePathToBeCreated(
          layerOneFolder,
          fileType,
        );

        break;

      case "quarter":
        const quarter = Math.floor(fileCreationTime.monthIndex / 3) + 1;

        layerOneFolder = `${fileCreationTime.year}-Q${quarter}`;

        [pathToBeCreated, layerOneFolder] = generatePathToBeCreated(
          layerOneFolder,
          fileType,
        );

        break;

      case "year":
        layerOneFolder = `${fileCreationTime.year}`;

        [pathToBeCreated, layerOneFolder] = generatePathToBeCreated(
          layerOneFolder,
          fileType,
        );

        break;
    }

    if (dry) {
      if (Object.hasOwn(dryRunRecord, layerOneFolder)) {
        if (Object.hasOwn(dryRunRecord[layerOneFolder], fileType)) {
          dryRunRecord[layerOneFolder][fileType].push(file);
        } else {
          dryRunRecord[layerOneFolder][fileType] = [file];
        }
      } else {
        dryRunRecord[layerOneFolder] = {};
        dryRunRecord[layerOneFolder][fileType] = [file];
      }

      continue;
    }

    try {
      await fs.promises.mkdir(pathToBeCreated, { recursive: true });
    } catch (err) {
      await rollback(logRecord, spinner);
    }

    try {
      await fs.promises.rename(file, `${pathToBeCreated}${path.sep}${file}`);
      logRecord.push({ from: file, to: path.join(pathToBeCreated, file) });
    } catch (err) {
      await rollback(logRecord, spinner);
    }
  }

  spinner.stop();

  if (dry) {
    console.log(
      `This is how this directory will be organized when run the command ${chalk.italic.bold(`stratify ${time_period}`)} -\n`,
    );

    for (const [topFolder, subfolders] of Object.entries(dryRunRecord)) {
      console.log(chalk.blue(`•${topFolder}`));

      for (const [folder, movedFiles] of Object.entries(subfolders)) {
        console.log(chalk.green(`  ${folder}`));

        for (const f of movedFiles) {
          console.log(chalk.bold(`    ${f}`));
        }
      }
    }
  } else {
    const refinedKey = process.cwd().split(path.sep).join("/");
    conf.set(refinedKey, logRecord);

    console.log(chalk.green("Directory organization is successful."));
  }
}

async function rollback(logRecord, spinner) {
  console.error(chalk.red(err));

  const foldersToBeDeleted = [
    ...new Set(logRecord.map((record) => record.to.split(path.sep)[0])),
  ];

  while (logRecord.length > 0) {
    const record = logRecord.pop();

    await fs.promises.rename(record.to, record.from);
  }

  for (const folder of foldersToBeDeleted) {
    await fs.promises.rm(folder, {
      recursive: true,
      force: true,
    });
  }

  spinner.stop();
  process.exit(1);
}
