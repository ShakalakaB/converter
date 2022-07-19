import { FC, PropsWithChildren } from "react";
import { func, number, string } from "prop-types";
import { SqlSyntax } from "../constants/SqlSyntax";

class SqlField {
  name: string;
  type: string;
  length: number;
  unsigned: boolean;
  isNull: boolean;

  constructor(name: string = "", type: string = "", length: number = 0, unsigned: boolean = false, isNull: boolean = false) {
    this.name = name;
    this.type = type;
    this.length = length;
    this.unsigned = unsigned;
    this.isNull = isNull;
  }
}

type Statement = {
  tokens: Array<string>,
  sql: string
  pointer: number
}

type Table = {
  tableName: string,
  fields: Array<SqlField>,
  sql: string
};

export const SqlParser: FC<PropsWithChildren<{}>> = () => {
  const sql = "CREATE TABLE DbName.TableName ( \n" +
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
    "                ); create table";

  // lexical-analyzer
  const lexicalPosition: [number, number][] = [];
  lexicalAnalyzer(sql, lexicalPosition);

  const tokenList: string[] = [];
  const tokenPosition: [number, number][] = [];
  tokenExtractor(sql, lexicalPosition, SqlSyntax.sqlTokenMap, SqlSyntax.sqlSingularTokenMap, tokenList, tokenPosition);

  const statements: Statement[] = extractStatement(tokenList, sql, tokenPosition);

  const tables: Table[] = [];
  for (let statement of statements) {
    if (statement.tokens[0] === "CREATE TABLE") {
      if (statement.tokens[statement.pointer] === "IF NOT EXISTS") {
        statement.pointer++;
      }

      // data name
      let database = "";
      let name = decodeIdentifier(statement);
      if (statement.tokens[statement.pointer] != undefined && statement.tokens[statement.pointer] === ".") {
        statement.pointer++;
        database = name;
        name = decodeIdentifier(statement);
      }

      const fields: SqlField[] = [];
      if (tokenIncluded(statement, "(")) {
        statement.pointer++;

        for (statement.pointer;
             statement.pointer < statement.tokens.length && statement.tokens[statement.pointer] !== ")";
             statement.pointer++) {
          const fieldTokens = extractField(statement);

        }

      }


    }

    if (statement.tokens[0] === "CREATE TEMPORARY TABLE") {

    }
  }

  console.log(tokenList);
  console.log(statements);
  return <h2>sqlparser</h2>;
};

function lexicalAnalyzer(sql: string, lexicalPosition: [number, number][]): void {
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
      lexicalPosition.push([position, position + match.index + match[0].length]);
      position += match.index + match[0].length;
      continue;
    }

    // backtick quoted field
    if (sql.slice(position, position + 1) == "`") {
      match = sql.slice(position + 1).match("`");
      if (!match || match.index == undefined) {
        throw new Error("Unterminated backtick");
      } else {
        lexicalPosition.push([position, position + match.index + match[0].length + 1]);
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
      lexicalPosition.push([position, position + match.index + match[0].length]);
      position += match.index + match.index + match[0].length;
      continue;
    }

    // literal character string
    if (sql[position] == "'" || sql[position] == "\"") {
      const quote = sql[position];
      // const regex: RegExp = /(?<!\\)"/;
      const regex: RegExp = new RegExp(`(?<!\\\\)${quote}`);
      match = sql.slice(position + 1).match(regex);
      if (!match || match.index == undefined) {
        throw new Error("Unterminated string");
      } else {
        lexicalPosition.push([position, position + match.index + match[0].length + 1]);
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

function tokenExtractor(sql: string, lexicalPosition: [number, number][],
                          sqlTokenMap: Map<string, Array<Array<String>>>,
                          sqlSingularTokenMap: Map<string, number>,
                          tokenList: string[],
                          tokenPosition: [number, number][]) {
  let i: number = 0;
  while (i < lexicalPosition.length) {
    const token = sql.slice(lexicalPosition[i][0], lexicalPosition[i][1]);
    const tokenUpperCase = token.toUpperCase();
    if (sqlTokenMap.get(tokenUpperCase) != undefined && sqlTokenMap.get(tokenUpperCase) instanceof Array) {
      let found = false;
      let sqlTokenList;
      let j = 1;
      for (sqlTokenList of sqlTokenMap.get(tokenUpperCase) || []) {
        let nextToken = tokenUpperCase;
        j = 1;
        for (j; j <= sqlTokenList.length - 1; j++) {
          nextToken += " " + sql.slice(lexicalPosition[i + j][0], lexicalPosition[i + j][1]).toUpperCase();
        }
        if (sqlTokenList.join(" ") === nextToken) {
          found = true;
          break;
        }
      }

      if (found && sqlTokenList) {
        tokenList.push(sqlTokenList.join(" "));
        tokenPosition.push([lexicalPosition[i][0], lexicalPosition[i + j - 1][1]]);
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

function extractStatement(tokenList: string[], sql: string, tokenPosition: [number, number][]): Array<Statement> {
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
        pointer: 0
      };
      statements.push(item);
    }
    temp = [];
    starter = i + 1;
  }

  if (temp.length > 0) {
    const item: Statement = {
      tokens: temp,
      sql: sql.slice(tokenPosition[starter] !== undefined ? tokenPosition[starter][0] : sql.length),
      pointer: 0
    };
    statements.push(item);
  }
  return statements;
}

function decodeIdentifier(statement: Statement): string {
  const token = statement.tokens[statement.pointer++];
  stripBackQuote(token);
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
  for (statement.pointer; statement.pointer < statement.tokens.length; statement.pointer++) {
    if (statement.tokens[statement.pointer] === value) {
      return true;
    }
  }
  return false;
}

function extractField(statement: Statement): string[] {
  const tokens: string[] = [];
  let stack = 0;

  while (statement.pointer < statement.tokens.length) {
    const token = statement.tokens[statement.pointer];

    if (token === "(") {
      stack++;
      tokens.push(statement.tokens[statement.pointer++]);
    } if (token === ")") {
      if (stack) {
        stack--;
        tokens.push(statement.tokens[statement.pointer++]);
      } else {
        return tokens;
      }
    } else if (token === ",") {
      if (stack) {
        tokens.push(statement.tokens[statement.pointer++])
      } else {
        statement.pointer++;
        return tokens;
      }
    } else {
      tokens.push(statement.tokens[statement.pointer++])
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
    if (!["PRIMARY KEY", "UNIQUE", "UNIQUE KEY", "UNIQUE INDEX", "FOREIGN KEY"].includes(tokens[1])) {
     constraint = stripBackQuote(tokens.shift());
    }
  }

  switch (tokens[0]) {
    case 'INDEX':
    case 'KEY':
    case 'UNIQUE':
    case 'UNIQUE INDEX':
    case 'UNIQUE KEY':
      //todo index parse
      return null;
    case "PRIMARY KEY":
      //todo primary key parse
      return null;
    case 'FULLTEXT':
    case 'FULLTEXT INDEX':
    case 'FULLTEXT KEY':
    case 'SPATIAL':
    case 'SPATIAL INDEX':
    case 'SPATIAL KEY':
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
  field.name = stripBackQuote(tokens.shift());
  field.type = tokens.shift()!.toUpperCase();

  switch (field.type) {
    case 'DATE':
    case 'YEAR':
    case 'TINYBLOB':
    case 'BLOB':
    case 'MEDIUMBLOB':
    case 'LONGBLOB':
    case 'JSON':
    case 'GEOMETRY':
    case 'POINT':
    case 'LINESTRING':
    case 'POLYGON':
    case 'MULTIPOINT':
    case 'MULTILINESTRING':
    case 'MULTIPOLYGON':
    case 'GEOMETRYCOLLECTION':
    case 'BOOLEAN':
    case 'BOOL':
      // nothing more to read
      break;
    case 'TIME':
    case 'TIMESTAMP':
    case 'DATETIME':
      if (tokens.length >= 3) {
        if (tokens[0] === "(" && tokens[2] === ")") {
          const fsp = tokens[1];
          tokens = tokens.slice(3);
        }
      }
      break;
    case 'TINYINT':
    case 'SMALLINT':
    case 'MEDIUMINT':
    case 'INT':
    case 'INTEGER':
    case 'BIGINT':
      parseFieldLength(tokens, field);
      parseFieldUnsigned(tokens, field);
      parseFieldZerofill(tokens, field);
      break;
    case 'REAL':
    case 'DOUBLE':
    case 'DOUBLE PRECISION':
    case 'FLOAT':
      parseFieldLengthDecimals(tokens, field);
      parseFieldUnsigned(tokens, field);
      parseFieldZerofill(tokens, field);
      break;
    case 'DECIMAL':
    case 'NUMERIC':
    case 'DEC':
    case 'FIXED':
      parseFieldLengthDecimals(tokens, field);
      parseFieldLength(tokens, field);
      parseFieldUnsigned(tokens, field);
      parseFieldZerofill(tokens, field);
      break;
    case 'BIT':
    case 'BINARY':
      parseFieldLength(tokens, field);
      break;
    case 'VARBINARY':
      parseFieldLength(tokens, field);
      break;
    case 'CHAR':
      parseFieldBinary(tokens, field);
      parseFieldLength(tokens, field);
      parseFieldCharset(tokens, field);
  }

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
  if (tokens.length >= 5 && tokens[0] === "(" && tokens[2] === "," && tokens[4] === ")") {
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