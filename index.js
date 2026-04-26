#! /usr/bin/env node

import { program, Argument } from "commander";
import execute from "./lib/execute.js";
import undo from "./command/undo.js";
import clear from "./command/clear.js";

program
  .addArgument(
    new Argument(
      "<time_period>",
      "the time period based on which the directory is to be organized",
    )
      .choices(["month", "quarter", "year"])
      .default("month"),
  )
  .option(
    "--dry",
    "simulate the result before running the actual command, see what will go where",
  )
  .action((time_period, options) => {
    execute(time_period, options.dry);
  });

program
  .command("undo")
  .description("bring the directory to its initial structure")
  .action(undo);

program
  .command("clear")
  .description("clear the structure history of the current directory")
  .action(clear);

program.parse();
