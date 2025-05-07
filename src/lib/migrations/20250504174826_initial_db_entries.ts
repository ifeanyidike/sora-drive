import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable("folders", (table) => {
      table.uuid("id").primary();
      table.text("name").notNullable();
      table
        .uuid("parent_id")
        .references("id")
        .inTable("folders")
        .onDelete("CASCADE");
      table.text("user_id").notNullable();
      table.timestamps(true, true);
      table.index("user_id", "idx_folders_user_id");
      table.index("parent_id", "idx_folders_parent_id");
    })
    .createTable("files", (table) => {
      table.uuid("id").primary();
      table.text("name").notNullable();
      table.text("type").notNullable();
      table.integer("size").notNullable();
      table.text("url").notNullable();
      table
        .uuid("folder_id")
        .references("id")
        .inTable("folders")
        .onDelete("CASCADE");
      table.text("user_id").notNullable();
      table.timestamps(true, true);
      table.index("user_id", "idx_files_user_id");
      table.index("folder_id", "idx_files_folder_id");
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("files").dropTableIfExists("folders");
}
