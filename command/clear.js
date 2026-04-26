import Conf from "conf";
import { confirm } from "@inquirer/prompts";
import { sep } from "node:path";
import chalk from "chalk";

const conf = new Conf({ projectName: "stratify" });

export default async function clear() {
  const recordHistory = conf.get();
  const recordHistoryKeys = Object.keys(recordHistory);

  const currentWorkingDirectory = process.cwd().split(sep).join("/");

  if (
    recordHistoryKeys.length === 0 ||
    !recordHistoryKeys.includes(currentWorkingDirectory)
  ) {
    console.error(
      chalk.red(
        `This directory has no organization history. Run ${chalk.white.bold("stratify --help")} for usage information.`,
      ),
    );
    process.exit(1);
  }

  const answer = await confirm({
    message:
      "Deleting the history means 'stratify undo' will not work. Continue?",
  });

  if (answer) {
    conf.delete(currentWorkingDirectory);
    console.log(chalk.cyan("History has been cleared successfully."));
  } else {
    console.log(chalk.cyan.bold("Phew!"));
  }
}
