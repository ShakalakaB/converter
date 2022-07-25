import { SqlSchemaParserUtil } from "../../utils/SqlSchemaParserUtil";
import { SqlParser } from "../../components/SqlParser";

test("empty string parser", () => {
  expect(SqlSchemaParserUtil.parseSchema("")).toBe("");
});

test("full schema test", () => {
  const sql =
    "CREATE TABLE DbName.TableName ( \n" +
    "                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \n" +
    "                    errcnt INT(10) UNSIGNED NOT NULL DEFAULT '0', \n" +
    "                    user_id INT UNSIGNED NOT NULL, \n" +
    "                    photo_id INT UNSIGNED NOT NULL, \n" +
    "                    place_id INT UNSIGNED NOT NULL, \n" +
    "                    next_processing_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \n" +
    "                    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \n" +
    "                    PRIMARY KEY (id), \n" +
    "                    KEY (place_id, next_processing_time), \n" +
    "                    UNIQUE KEY (user_id, place_id, photo_id) \n" +
    "                ); ";
  expect(SqlSchemaParserUtil.parseSchema(sql)).toBe(
    "public class TableName {\n" +
      "\tprivate Integer id;\n" +
      "\n" +
      "\tprivate Integer errcnt;\n" +
      "\n" +
      "\tprivate Integer userId;\n" +
      "\n" +
      "\tprivate Integer photoId;\n" +
      "\n" +
      "\tprivate Integer placeId;\n" +
      "\n" +
      "\tprivate Timestamp nextProcessingTime;\n" +
      "\n" +
      "\tprivate Timestamp created;\n" +
      "\n" +
      "}\n"
  );
});

test("empty table test", () => {
  const sql = "CREATE TABLE foo";
  expect(SqlSchemaParserUtil.parseSchema(sql)).toBe(
    "public class Foo {\n" + "\tprivate Integer bar;\n" + "\n" + "}\n"
  );
});

test("multiple tables test", () => {
  const sql = "CREATE TABLE foo (bar INT);\n" + "CREATE TABLE bar (bar INT)";
  expect(SqlSchemaParserUtil.parseSchema(sql)).toBe(
    "public class Foo {\n" +
      "\tprivate Integer bar;\n" +
      "\n" +
      "}\n" +
      "public class Bar {\n" +
      "\tprivate Integer bar;\n" +
      "\n" +
      "}\n"
  );
});
