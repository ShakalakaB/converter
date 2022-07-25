import { SqlSchemaParserUtil } from "../../utils/SqlSchemaParserUtil";

test("empty string parser", () => {
  expect(SqlSchemaParserUtil.parseSchema("")).toBe("");
});

test("full schema test", () => {
  const sql =
    "CREATE TABLE DbName.TableName ( \n" +
    "                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \n" +
    "                    errcnt INT(10) UNSIGNED NOT NULL DEFAULT \\'0\\', \n" +
    "                    user_id INT UNSIGNED NOT NULL, \n" +
    "                    photo_id INT UNSIGNED NOT NULL, \n" +
    "                    place_id INT UNSIGNED NOT NULL, \n" +
    "                    next_processing_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \n" +
    "                    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \n" +
    "                    PRIMARY KEY (id), \n" +
    "                    KEY (place_id, next_processing_time), \n" +
    "                    UNIQUE KEY (user_id, place_id, photo_id) \n" +
    "                );";
  expect(SqlSchemaParserUtil.parseSchema("")).toBe("");
});
