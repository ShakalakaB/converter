import { FC, PropsWithChildren } from "react";
import { func, number, string } from "prop-types";
import { SqlToken } from "../constants/SqlToken";
import { SqlToJavaDataType } from "../constants/SqlToJavaDataType";

// https://docs.microsoft.com/en-us/sql/language-extensions/how-to/java-to-sql-data-types?view=sql-server-ver16
// https://www.w3schools.com/sql/sql_datatypes.asp
class SqlField {
  name: string;
  type: string;
  length: number;
  unsigned: boolean;
  nullable: boolean;

  constructor(
    name: string = "",
    type: string = "",
    length: number = 0,
    unsigned: boolean = false,
    isNull: boolean = false
  ) {
    this.name = name;
    this.type = type;
    this.length = length;
    this.unsigned = unsigned;
    this.nullable = isNull;
  }
}

type Statement = {
  tokens: Array<string>;
  sql: string;
  pointer: number;
};

type Table = {
  tableName: string;
  fields: Array<SqlField>;
  sql: string;
};

enum NameType {
  CAMEL_CASE,
  UPPER_CAMEL_CASE,
  UNDERSCORE,
}

export const SqlParser: FC<{
  sql: string;
  nameType: NameType;
  getterAndSetterIncluded: boolean;
}> = ({
  sql = "",
  nameType = NameType.CAMEL_CASE,
  getterAndSetterIncluded,
}) => {
  // const sql =
  //   "CREATE TABLE DbName.TableName ( \n" +
  //   "                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \n" +
  //   "                    errcnt INT(10) UNSIGNED NOT NULL DEFAULT '0', \n" +
  //   "                    user_id INT UNSIGNED NOT NULL, \n" +
  //   "                    photo_id INT UNSIGNED NOT NULL, \n" +
  //   "                    place_id INT UNSIGNED NOT NULL, \n" +
  //   "                    next_processing_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \n" +
  //   "                    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \n" +
  //   "                    PRIMARY KEY (id), \n" +
  //   "                    KEY (place_id, next_processing_time), \n" +
  //   "                    UNIQUE KEY (user_id, place_id, photo_id) \n" +
  //   "                ); create table";

  // lexical-analyzer
  const lexicalPosition: [number, number][] = [];
  lexicalAnalyzer(sql, lexicalPosition);

  const tokenList: string[] = [];
  const tokenPosition: [number, number][] = [];
  tokenExtractor(
    sql,
    lexicalPosition,
    SqlToken.sqlTokenMap,
    SqlToken.sqlSingularTokenMap,
    tokenList,
    tokenPosition
  );

  const statements: Statement[] = extractStatement(
    tokenList,
    sql,
    tokenPosition
  );

  const tables: Table[] = parseTable(statements);

  let javaCode: string = "";
  for (let table of tables) {
    javaCode += `public class ${table.tableName} {\n`;
    for (let field of table.fields) {
      javaCode +=
        "\t" +
        `private ${SqlToJavaDataType.dataTypeMap.get(field.type)} ${
          field.name
        };\n\n`;
    }
    if (getterAndSetterIncluded) {
      for (let field of table.fields) {
        const dataType: string | undefined = SqlToJavaDataType.dataTypeMap.get(
          field.type
        );
        const methodSuffix = field.name[0].toUpperCase() + field.name.slice(1);
        javaCode += "\t" + `public ${dataType} get${methodSuffix} () {\n`;
        javaCode += "\t\t" + `return this.${field.name};\n`;
        javaCode += "\t" + `}\n\n`;

        javaCode +=
          "\t" +
          `public ${dataType} set${methodSuffix} (${dataType} ${field.name}) {\n`;
        javaCode += "\t\t" + `this.${field.name} = ${field.name};\n`;
        javaCode += "\t" + `}\n\n`;
      }
    }
    javaCode += "}";
  }

  // console.log(tokenList);
  // console.log(statements);
  // console.log(tables);
  console.log(javaCode);
  return <h2>sqlparser</h2>;
};

function lexicalAnalyzer(
  sql: string,
  lexicalPosition: [number, number][]
): void {
  let position = 0;
  while (position < sql.length) {
    // new line, space
    let match: RegExpMatchArray | null = sql.slice(position).match(/^\s+/);
    if (match && match.index != undefined) {
      position += match.index + match[0].length;
      continue;
    }

    // comment
    if (sql.slice(position).match(/^(--|#)/)) {
      match = sql.slice(position).match(/[\n\r]/);
      if (match == null || match.index == null) {
        throw new Error("Unterminated comment");
      } else {
        position += match.index + match[0].length;
        continue;
      }
    }
    if (sql.slice(position).match(/^\/\*/)) {
      match = sql.slice(position).match(/\*\//);
      if (match == null || match.index == null) {
        throw new Error("Unterminated comment");
      } else {
        position += match.index + match[0].length;
        continue;
      }
    }

    // [a-zA-Z0-9_]*
    match = sql.slice(position).match(/^[a-zA-Z0-9_]+/);
    if (match && match.index != undefined) {
      lexicalPosition.push([
        position,
        position + match.index + match[0].length,
      ]);
      position += match.index + match[0].length;
      continue;
    }

    // backtick quoted field
    if (sql.slice(position, position + 1) == "`") {
      match = sql.slice(position + 1).match("`");
      if (!match || match.index == undefined) {
        throw new Error("Unterminated backtick");
      } else {
        lexicalPosition.push([
          position,
          position + match.index + match[0].length + 1,
        ]);
        position += match.index + match[0].length + 1;
        continue;
      }
    }

    // <unsigned numeric literal>
    // <unsigned integer> [ <period> [ <unsigned integer> ] ]
    // <period> <unsigned integer>
    // <unsigned integer> ::= <digit>...
    match = sql.slice(position).match(/^(\d+\.?\d*|\.\d+)/);
    if (match && match.index != undefined) {
      lexicalPosition.push([
        position,
        position + match.index + match[0].length,
      ]);
      position += match.index + match.index + match[0].length;
      continue;
    }

    // literal character string
    if (sql[position] == "'" || sql[position] == '"') {
      const quote = sql[position];
      // const regex: RegExp = /(?<!\\)"/;
      const regex: RegExp = new RegExp(`(?<!\\\\)${quote}`);
      match = sql.slice(position + 1).match(regex);
      if (!match || match.index == undefined) {
        throw new Error("Unterminated string");
      } else {
        lexicalPosition.push([
          position,
          position + match.index + match[0].length + 1,
        ]);
        position += match.index + match[0].length + 1;
        continue;
      }
    }

    // date string
    // time string
    // timestamp string
    // interval string
    // delimited identifier
    // SQL special character
    // not equals operator
    // greater than or equals operator
    // less than or equals operator
    // concatenation operator
    // double period
    // left/right bracket
    lexicalPosition.push([position, position + 1]);
    position++;
  }
}

function tokenExtractor(
  sql: string,
  lexicalPosition: [number, number][],
  sqlTokenMap: Map<string, Array<Array<String>>>,
  sqlSingularTokenMap: Map<string, number>,
  tokenList: string[],
  tokenPosition: [number, number][]
) {
  let i: number = 0;
  while (i < lexicalPosition.length) {
    const token = sql.slice(lexicalPosition[i][0], lexicalPosition[i][1]);
    const tokenUpperCase = token.toUpperCase();
    if (
      sqlTokenMap.get(tokenUpperCase) != undefined &&
      sqlTokenMap.get(tokenUpperCase) instanceof Array
    ) {
      let found = false;
      let sqlTokenList;
      let j = 1;
      for (sqlTokenList of sqlTokenMap.get(tokenUpperCase) || []) {
        let nextToken = tokenUpperCase;
        j = 1;
        for (j; j <= sqlTokenList.length - 1; j++) {
          nextToken +=
            " " +
            sql
              .slice(lexicalPosition[i + j][0], lexicalPosition[i + j][1])
              .toUpperCase();
        }
        if (sqlTokenList.join(" ") === nextToken) {
          found = true;
          break;
        }
      }

      if (found && sqlTokenList) {
        tokenList.push(sqlTokenList.join(" "));
        tokenPosition.push([
          lexicalPosition[i][0],
          lexicalPosition[i + j - 1][1],
        ]);
        i += j;
        continue;
      }
    }

    if (sqlSingularTokenMap.get(tokenUpperCase) == 1) {
      tokenList.push(tokenUpperCase);
      tokenPosition.push(lexicalPosition[i]);
      i++;
      continue;
    }

    tokenList.push(token);
    tokenPosition.push(lexicalPosition[i]);
    i++;
  }
}

function extractStatement(
  tokenList: string[],
  sql: string,
  tokenPosition: [number, number][]
): Array<Statement> {
  const statements: Array<Statement> = [];
  let temp: Array<string> = [];
  let starter = 0;
  let i = 0;
  for (i; i < tokenList.length; i++) {
    const token = tokenList[i];
    if (token !== ";") {
      temp.push(token);
      continue;
    }

    if (temp.length > 0) {
      const item: Statement = {
        tokens: temp,
        sql: sql.slice(tokenPosition[starter][0], tokenPosition[i][1]),
        pointer: 0,
      };
      statements.push(item);
    }
    temp = [];
    starter = i + 1;
  }

  if (temp.length > 0) {
    const item: Statement = {
      tokens: temp,
      sql: sql.slice(
        tokenPosition[starter] !== undefined
          ? tokenPosition[starter][0]
          : sql.length
      ),
      pointer: 0,
    };
    statements.push(item);
  }
  return statements;
}

function decodeIdentifier(statement: Statement): string {
  const token = statement.tokens[statement.pointer++];
  return stripBackQuote(token);
}

function stripBackQuote(token: string | undefined): string {
  if (token == undefined) {
    return "";
  }
  if (token[0] === "`") {
    return token.slice(1, -1);
  }
  return token;
}

function tokenIncluded(statement: Statement, value: string): boolean {
  let i = statement.pointer;
  for (i; i < statement.tokens.length; i++) {
    if (statement.tokens[i] === value) {
      return true;
    }
  }
  return false;
}

function extractFieldTokens(statement: Statement): string[] {
  const tokens: string[] = [];
  let stack = 0;

  while (statement.pointer < statement.tokens.length) {
    const token = statement.tokens[statement.pointer];

    if (token === "(") {
      stack++;
      tokens.push(statement.tokens[statement.pointer++]);
    }
    if (token === ")") {
      if (stack) {
        stack--;
        tokens.push(statement.tokens[statement.pointer++]);
      } else {
        return tokens;
      }
    } else if (token === ",") {
      if (stack) {
        tokens.push(statement.tokens[statement.pointer++]);
      } else {
        statement.pointer++;
        return tokens;
      }
    } else {
      tokens.push(statement.tokens[statement.pointer++]);
    }
  }
  return tokens;
}

function parseField(tokens: string[]): SqlField | null {
  let hasConstraint = false;
  let constraint = null;

  if (tokens[0] === "CONSTRAINT") {
    hasConstraint = true;
    tokens.shift();
    if (
      ![
        "PRIMARY KEY",
        "UNIQUE",
        "UNIQUE KEY",
        "UNIQUE INDEX",
        "FOREIGN KEY",
      ].includes(tokens[1])
    ) {
      constraint = stripBackQuote(tokens.shift());
    }
  }

  switch (tokens[0]) {
    case "INDEX":
    case "KEY":
    case "UNIQUE":
    case "UNIQUE INDEX":
    case "UNIQUE KEY":
      //todo index parse
      return null;
    case "PRIMARY KEY":
      //todo primary key parse
      return null;
    case "FULLTEXT":
    case "FULLTEXT INDEX":
    case "FULLTEXT KEY":
    case "SPATIAL":
    case "SPATIAL INDEX":
    case "SPATIAL KEY":
      //todo index parse
      return null;
    case "FOREIGN KEY":
      //todo index parse
      return null;
    case "CHECK":
      //todo index parse
      return null;
  }

  const field = new SqlField();
  field.name = formatFieldName(stripBackQuote(tokens.shift()));

  field.type = tokens.shift()!.toUpperCase();

  switch (field.type) {
    case "DATE":
    case "YEAR":
    case "TINYBLOB":
    case "BLOB":
    case "MEDIUMBLOB":
    case "LONGBLOB":
    case "GEOMETRY":
    case "POINT":
    case "LINESTRING":
    case "POLYGON":
    case "MULTIPOINT":
    case "MULTILINESTRING":
    case "MULTIPOLYGON":
    case "GEOMETRYCOLLECTION":
    case "BOOLEAN":
    case "BOOL":
      // nothing more to read
      break;
    case "TIME":
    case "TIMESTAMP":
    case "DATETIME":
      if (tokens.length >= 3) {
        if (tokens[0] === "(" && tokens[2] === ")") {
          const fsp = tokens[1];
          tokens = tokens.slice(3);
        }
      }
      break;
    case "TINYINT":
    case "SMALLINT":
    case "MEDIUMINT":
    case "INT":
    case "INTEGER":
    case "BIGINT":
      parseFieldLength(tokens, field);
      parseFieldUnsigned(tokens, field);
      parseFieldZerofill(tokens, field);
      break;
    case "REAL":
    case "DOUBLE":
    case "DOUBLE PRECISION":
    case "FLOAT":
      parseFieldLengthDecimals(tokens, field);
      parseFieldUnsigned(tokens, field);
      parseFieldZerofill(tokens, field);
      break;
    case "DECIMAL":
    case "NUMERIC":
    case "DEC":
    case "FIXED":
      parseFieldLengthDecimals(tokens, field);
      parseFieldLength(tokens, field);
      parseFieldUnsigned(tokens, field);
      parseFieldZerofill(tokens, field);
      break;
    case "BIT":
    case "BINARY":
      parseFieldLength(tokens, field);
      break;
    case "VARBINARY":
      parseFieldLength(tokens, field);
      break;
    case "CHAR":
      parseFieldBinary(tokens, field);
      parseFieldLength(tokens, field);
      parseFieldCharset(tokens, field);
      parseFieldCollate(tokens, field);
      break;
    case "VARCHAR":
    case "CHARACTER VARYING":
      parseFieldBinary(tokens, field);
      parseFieldLength(tokens, field);
      parseFieldCharset(tokens, field);
      parseFieldCollate(tokens, field);
      break;
    case "TINYTEXT":
    case "TEXT":
    case "MEDIUMTEXT":
    case "LONGTEXT":
    case "JSON":
      parseFieldBinary(tokens, field);
      parseFieldCharset(tokens, field);
      parseFieldCollate(tokens, field);
      break;
    case "ENUM":
    case "SET":
      parseValueList(tokens);
      parseFieldCharset(tokens, field);
      parseFieldCharset(tokens, field);
      break;
    default:
      throw new Error("Unsupported field type: " + field.type);
  }

  if (tokens[0]?.toUpperCase() === "NOT NULL") {
    field.nullable = false;
    tokens.shift();
  }
  if (tokens[0]?.toUpperCase() === "NULL") {
    field.nullable = true;
  }

  if (tokens[0]?.toUpperCase() === "DEFAULT") {
    if (decodeValue(tokens[1]) === "NULL") {
      field.nullable = true;
    }
    tokens.shift();
    tokens.shift();
  }

  if (tokens[0]?.toUpperCase() === "AUTO_INCREMENT") {
    tokens.shift();
  }

  return field;
}

function parseFieldLength(tokens: string[], field: SqlField): void {
  if (tokens.length >= 3 && tokens[0] === "(" && tokens[2] === ")") {
    field.length = Number(tokens[1]);
    for (let i = 0; i < 3; i++) {
      tokens.shift();
    }
  }
}

function parseFieldUnsigned(tokens: string[], field: SqlField): void {
  if (tokens[0]?.toUpperCase() === "UNSIGNED") {
    field.unsigned = true;
    tokens.shift();
  }
}

function parseFieldZerofill(tokens: string[], field: SqlField): void {
  if (tokens[0]?.toUpperCase() === "ZEROFILL") {
    tokens.shift();
  }
}

function parseFieldLengthDecimals(tokens: string[], field: SqlField): void {
  if (
    tokens.length >= 5 &&
    tokens[0] === "(" &&
    tokens[2] === "," &&
    tokens[4] === ")"
  ) {
    field.length = Number(tokens[1]);
    for (let i = 0; i < 5; i++) {
      tokens.shift();
    }
  }
}

function parseFieldBinary(tokens: string[], field: SqlField): void {
  if (tokens[0]?.toUpperCase() === "BINARY") {
    tokens.shift();
  }
}

function parseFieldCharset(tokens: string[], field: SqlField): void {
  if (tokens[0]?.toUpperCase() === "CHARACTER SET") {
    tokens.shift();
    tokens.shift();
  }
}

function parseFieldCollate(tokens: string[], field: SqlField): void {
  if (tokens[0]?.toUpperCase() === "COLLATE") {
    tokens.shift();
    tokens.shift();
  }
}

function parseValueList(tokens: string[]): string[] | null {
  if (tokens[0] === "(") {
    return null;
  }
  tokens.shift();

  const values: string[] = [];
  while (tokens.length > 0) {
    if (tokens[0] === ")") {
      tokens.shift();
      return values;
    }

    values.push(stripBackQuote(tokens.shift()));

    if (tokens[0] === ")") {
      tokens.shift();
      return values;
    }

    if (tokens[0] === ",") {
      tokens.shift();
    } else {
      return values;
    }
  }
  return values;
}

function decodeValue(token: string): string {
  if (token[0] === "'" || token[0] === '"') {
    const newLines: Map<string, string> = new Map<string, string>([
      ["n", "\n"],
      ["r", "\r"],
      ["t", "\t"],
    ]);
    let value = "";
    for (let i = 0; i < token.length - 1; i++) {
      if (token[i] == "\\") {
        if (newLines.get(token[i + 1])) {
          value += newLines.get(token[i + 1]);
        } else {
          value += token[i + 1];
        }
        i++;
      } else {
        value += token[i];
      }
    }
    return value;
  }
  return token;
}

function parseTableName(statement: Statement): string {
  if (statement.tokens[statement.pointer] === "IF NOT EXISTS") {
    statement.pointer++;
  }

  // data name
  let database = "";
  let name = decodeIdentifier(statement);
  if (statement.tokens[statement.pointer] === ".") {
    statement.pointer++;
    database = name;
    name = decodeIdentifier(statement);
  }

  // CREATE TABLE x LIKE y
  if (tokenIncluded(statement, "LIKE")) {
    statement.pointer++;
    let oldName = decodeIdentifier(statement);

    let likeDatabase = null;
    if (statement.tokens[statement.pointer] === ".") {
      statement.pointer++;
      likeDatabase = oldName;
      oldName = decodeIdentifier(statement);
    }
  }
  return name;
}

function parseTable(statements: Statement[]) {
  const tables: Table[] = [];
  for (let statement of statements) {
    if (
      statement.tokens[statement.pointer++] === "CREATE TABLE" ||
      statement.tokens[statement.pointer++] === "CREATE TEMPORARY TABLE"
    ) {
      const tableName = upperCamelize(parseTableName(statement), "TableName");

      const fields: SqlField[] = [];
      if (tokenIncluded(statement, "(")) {
        statement.pointer++;

        while (
          statement.pointer < statement.tokens.length &&
          statement.tokens[statement.pointer] !== ")"
        ) {
          const fieldTokens = extractFieldTokens(statement);
          const optionalField: SqlField | null = parseField(fieldTokens);
          optionalField !== null && fields.push(optionalField);
        }

        tables.push({
          tableName,
          fields,
          sql: statement.sql,
        });
      }
    }
  }
  return tables;
}

function camelize(value: string, defaultValue: string = "") {
  value = value ? value.trim() : "";
  if (!value) {
    return defaultValue;
  }
  return value
    .replaceAll(/(?<=_|\s)[a-z]/g, (matchedWord) => matchedWord.toUpperCase())
    .replaceAll(/[_\s]+/g, "");
}

function upperCamelize(value: string, defaultValue: string = "") {
  value = value ? value.trim() : "";
  if (!value) {
    return defaultValue;
  }

  return (value[0].toUpperCase() + value.slice(1))
    .replaceAll(/(?<=_|\s)[a-z]/g, (matchedWord) => matchedWord.toUpperCase())
    .replaceAll(/[_\s]+/g, "");
}

function underscore(value: string, defaultValue: string = "") {
  value = value ? value.trim() : "";
  if (!value) {
    return defaultValue;
  }
  return value
    .replaceAll(
      /(?<=.)[A-Z]/g,
      (matchedWord) => "_" + matchedWord.toLowerCase()
    )
    .replaceAll(/\s+/g, (matchedWord) => "_")
    .replaceAll(/[\s]+/g, "");
}

function formatFieldName(
  fieldName: string,
  type: NameType = NameType.CAMEL_CASE
): string {
  switch (type) {
    case NameType.UNDERSCORE:
      return underscore(fieldName);
    case NameType.UPPER_CAMEL_CASE:
      return upperCamelize(fieldName);
    default:
      return camelize(fieldName);
  }
}
