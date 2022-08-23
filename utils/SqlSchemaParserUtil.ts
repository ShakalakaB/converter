import { SqlToken } from "../constants/SqlToken";
import { SqlToJavaDataType } from "../constants/SqlToJavaDataType";
import { NameType, SqlField, Statement, Table } from "../models/SqlModels";

export class SqlSchemaParserUtil {
  static parseSchema(
    sql: string = "",
    nameType = NameType.CAMEL_CASE,
    getterAndSetterIncluded: boolean = false,
    keepComment: boolean = false
  ): string {
    const lexicalPosition: [number, number][] = [];
    // lexical-analyzer
    SqlSchemaParserUtil.lexicalAnalyzer(sql, lexicalPosition);

    const tokenList: string[] = [];
    const tokenPosition: [number, number][] = [];
    SqlSchemaParserUtil.tokenExtractor(
      sql,
      lexicalPosition,
      SqlToken.sqlTokenMap,
      SqlToken.sqlSingularTokenMap,
      tokenList,
      tokenPosition
    );

    const statements: Statement[] = SqlSchemaParserUtil.extractStatement(
      tokenList,
      sql,
      tokenPosition
    );

    const tables: Table[] = SqlSchemaParserUtil.parseTable(
      statements,
      nameType
    );

    let javaCode: string = "";
    for (let table of tables) {
      javaCode += `public class ${table.tableName} {\n`;
      for (let field of table.fields) {
        if (keepComment && field.comment.length > 0) {
          javaCode += "\t/**\n" + "\t * " + field.comment + "\n" + "\t */\n";
        }
        javaCode +=
          "\t" +
          `private ${SqlToJavaDataType.dataTypeMap.get(field.type)} ${
            field.name
          };\n\n`;
      }
      if (getterAndSetterIncluded) {
        for (let field of table.fields) {
          const dataType: string | undefined =
            SqlToJavaDataType.dataTypeMap.get(field.type);
          const methodSuffix =
            field.name[0].toUpperCase() + field.name.slice(1);
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
      javaCode += "}\n";
    }
    return javaCode;
  }

  private static lexicalAnalyzer(
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

  private static tokenExtractor(
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

  private static extractStatement(
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

  private static decodeIdentifier(statement: Statement): string {
    const token = statement.tokens[statement.pointer++];
    return this.stripBackQuote(token);
  }

  private static stripBackQuote(token: string | undefined): string {
    if (token == undefined) {
      return "";
    }
    if (token[0] === "`") {
      return token.slice(1, -1);
    }
    return token;
  }

  private static tokenIncluded(statement: Statement, value: string): boolean {
    let i = statement.pointer;
    for (i; i < statement.tokens.length; i++) {
      if (statement.tokens[i] === value) {
        return true;
      }
    }
    return false;
  }

  private static extractFieldTokens(statement: Statement): string[] {
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

  private static parseField(
    tokens: string[],
    nameType: NameType
  ): SqlField | null {
    let hasConstraint = false;
    let constraint = null;

    if (tokens[0] === "CONSTRAINT") {
      hasConstraint = true;
      tokens.shift();
      if (
        [
          "PRIMARY KEY",
          "UNIQUE",
          "UNIQUE KEY",
          "UNIQUE INDEX",
          "FOREIGN KEY",
        ].includes(tokens[1])
      ) {
        constraint = SqlSchemaParserUtil.stripBackQuote(tokens.shift());
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
    field.name = SqlSchemaParserUtil.formatFieldName(
      SqlSchemaParserUtil.stripBackQuote(tokens.shift()),
      nameType
    );

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
        SqlSchemaParserUtil.parseFieldLength(tokens, field);
        SqlSchemaParserUtil.parseFieldUnsigned(tokens, field);
        SqlSchemaParserUtil.parseFieldZerofill(tokens, field);
        break;
      case "REAL":
      case "DOUBLE":
      case "DOUBLE PRECISION":
      case "FLOAT":
        SqlSchemaParserUtil.parseFieldLengthDecimals(tokens, field);
        SqlSchemaParserUtil.parseFieldUnsigned(tokens, field);
        SqlSchemaParserUtil.parseFieldZerofill(tokens, field);
        break;
      case "DECIMAL":
      case "NUMERIC":
      case "DEC":
      case "FIXED":
        SqlSchemaParserUtil.parseFieldLengthDecimals(tokens, field);
        SqlSchemaParserUtil.parseFieldLength(tokens, field);
        SqlSchemaParserUtil.parseFieldUnsigned(tokens, field);
        SqlSchemaParserUtil.parseFieldZerofill(tokens, field);
        break;
      case "BIT":
      case "BINARY":
        SqlSchemaParserUtil.parseFieldLength(tokens, field);
        break;
      case "VARBINARY":
        SqlSchemaParserUtil.parseFieldLength(tokens, field);
        break;
      case "CHAR":
        SqlSchemaParserUtil.parseFieldBinary(tokens, field);
        SqlSchemaParserUtil.parseFieldLength(tokens, field);
        SqlSchemaParserUtil.parseFieldCharset(tokens, field);
        SqlSchemaParserUtil.parseFieldCollate(tokens, field);
        break;
      case "VARCHAR":
      case "CHARACTER VARYING":
        SqlSchemaParserUtil.parseFieldBinary(tokens, field);
        SqlSchemaParserUtil.parseFieldLength(tokens, field);
        SqlSchemaParserUtil.parseFieldCharset(tokens, field);
        SqlSchemaParserUtil.parseFieldCollate(tokens, field);
        break;
      case "TINYTEXT":
      case "TEXT":
      case "MEDIUMTEXT":
      case "LONGTEXT":
      case "JSON":
        SqlSchemaParserUtil.parseFieldBinary(tokens, field);
        SqlSchemaParserUtil.parseFieldCharset(tokens, field);
        SqlSchemaParserUtil.parseFieldCollate(tokens, field);
        break;
      case "ENUM":
      case "SET":
        SqlSchemaParserUtil.parseValueList(tokens);
        SqlSchemaParserUtil.parseFieldCharset(tokens, field);
        SqlSchemaParserUtil.parseFieldCharset(tokens, field);
        break;
      default:
        throw new Error("Unsupported field type: " + field.type);
    }

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i]?.toUpperCase() === "NOT NULL") {
        field.nullable = false;
        continue;
      }
      if (tokens[i]?.toUpperCase() === "NULL") {
        field.nullable = true;
        continue;
      }

      if (tokens[i]?.toUpperCase() === "DEFAULT") {
        if (SqlSchemaParserUtil.decodeValue(tokens[++i]) === "NULL") {
          field.nullable = true;
        }
        continue;
      }

      if (tokens[i]?.toUpperCase() === "AUTO_INCREMENT") {
        continue;
      }

      if (tokens[i]?.toUpperCase() === "COMMENT") {
        field.comment = tokens[i + 1].replace(/(^'|^"|'$|"$)/g, "");
      }
    }

    return field;
  }

  private static parseFieldLength(tokens: string[], field: SqlField): void {
    if (tokens.length >= 3 && tokens[0] === "(" && tokens[2] === ")") {
      field.length = Number(tokens[1]);
      for (let i = 0; i < 3; i++) {
        tokens.shift();
      }
    }
  }

  private static parseFieldUnsigned(tokens: string[], field: SqlField): void {
    if (tokens[0]?.toUpperCase() === "UNSIGNED") {
      field.unsigned = true;
      tokens.shift();
    }
  }

  private static parseFieldZerofill(tokens: string[], field: SqlField): void {
    if (tokens[0]?.toUpperCase() === "ZEROFILL") {
      tokens.shift();
    }
  }

  private static parseFieldLengthDecimals(
    tokens: string[],
    field: SqlField
  ): void {
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

  private static parseFieldBinary(tokens: string[], field: SqlField): void {
    if (tokens[0]?.toUpperCase() === "BINARY") {
      tokens.shift();
    }
  }

  private static parseFieldCharset(tokens: string[], field: SqlField): void {
    if (tokens[0]?.toUpperCase() === "CHARACTER SET") {
      tokens.shift();
      tokens.shift();
    }
  }

  private static parseFieldCollate(tokens: string[], field: SqlField): void {
    if (tokens[0]?.toUpperCase() === "COLLATE") {
      tokens.shift();
      tokens.shift();
    }
  }

  private static parseValueList(tokens: string[]): string[] | null {
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

      values.push(SqlSchemaParserUtil.stripBackQuote(tokens.shift()));

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

  private static decodeValue(token: string): string {
    if (token[0] === "'" || token[0] === '"') {
      const newLines: Map<string, string> = new Map<string, string>([
        ["n", "\n"],
        ["r", "\r"],
        ["t", "\t"],
      ]);
      let value = "";
      for (let i = 0; i < token.length; i++) {
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

  private static parseTableName(statement: Statement): string {
    if (statement.tokens[statement.pointer] === "IF NOT EXISTS") {
      statement.pointer++;
    }

    // data name
    let database = "";
    let name = SqlSchemaParserUtil.decodeIdentifier(statement);
    if (statement.tokens[statement.pointer] === ".") {
      statement.pointer++;
      database = name;
      name = SqlSchemaParserUtil.decodeIdentifier(statement);
    }

    // CREATE TABLE x LIKE y
    if (SqlSchemaParserUtil.tokenIncluded(statement, "LIKE")) {
      statement.pointer++;
      let oldName = SqlSchemaParserUtil.decodeIdentifier(statement);

      let likeDatabase = null;
      if (statement.tokens[statement.pointer] === ".") {
        statement.pointer++;
        likeDatabase = oldName;
        oldName = SqlSchemaParserUtil.decodeIdentifier(statement);
      }
    }
    return name;
  }

  private static parseTable(statements: Statement[], nameType: NameType) {
    const tables: Table[] = [];
    for (let statement of statements) {
      if (
        statement.tokens[statement.pointer++] === "CREATE TABLE" ||
        statement.tokens[statement.pointer++] === "CREATE TEMPORARY TABLE"
      ) {
        const tableName = SqlSchemaParserUtil.upperCamelize(
          SqlSchemaParserUtil.parseTableName(statement),
          "TableName"
        );

        const fields: SqlField[] = [];
        if (SqlSchemaParserUtil.tokenIncluded(statement, "(")) {
          statement.pointer++;

          while (
            statement.pointer < statement.tokens.length &&
            statement.tokens[statement.pointer] !== ")"
          ) {
            const fieldTokens =
              SqlSchemaParserUtil.extractFieldTokens(statement);
            const optionalField: SqlField | null =
              SqlSchemaParserUtil.parseField(fieldTokens, nameType);
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

  private static camelize(value: string, defaultValue: string = "") {
    value = value ? value.trim() : "";
    if (!value) {
      return defaultValue;
    }
    return value
      .replaceAll(/(?<=_|\s)[a-z]/g, (matchedWord) => matchedWord.toUpperCase())
      .replaceAll(/[_\s]+/g, "");
  }

  private static upperCamelize(value: string, defaultValue: string = "") {
    value = value ? value.trim() : "";
    if (!value) {
      return defaultValue;
    }

    return (value[0].toUpperCase() + value.slice(1))
      .replaceAll(/(?<=_|\s)[a-z]/g, (matchedWord) => matchedWord.toUpperCase())
      .replaceAll(/[_\s]+/g, "");
  }

  private static underscore(value: string, defaultValue: string = "") {
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

  private static formatFieldName(
    fieldName: string,
    type: NameType = NameType.CAMEL_CASE
  ): string {
    switch (type) {
      case NameType.UNDERSCORE:
        return SqlSchemaParserUtil.underscore(fieldName);
      case NameType.UPPER_CAMEL_CASE:
        return SqlSchemaParserUtil.upperCamelize(fieldName);
      default:
        return SqlSchemaParserUtil.camelize(fieldName);
    }
  }
}
