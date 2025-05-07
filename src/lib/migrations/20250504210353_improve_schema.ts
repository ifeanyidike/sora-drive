import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("folders", (table) => {
      table.boolean("trashed").defaultTo(false);
      table.boolean("starred").defaultTo(false);
    })
    .alterTable("files", (table) => {
      table.boolean("trashed").defaultTo(false);
      table.boolean("starred").defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("folders", (table) => {
      table.dropColumn("trashed");
      table.dropColumn("starred");
    })
    .alterTable("files", (table) => {
      table.dropColumn("trashed");
      table.dropColumn("starred");
    });
}
