import { FC, PropsWithChildren } from "react";
import { number, string } from "prop-types";
import { SqlSyntax } from "../constants/SqlSyntax";

type SqlField = {
  name: string,
  type: string,
  length: number,
  unsigned: boolean,
  null: boolean
};

type Statement = {
  tokens: Array<string>,
  sql: string,
  fields: Array<SqlField>
}

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
    "                );";

  // lexical-analyzer
  const lexicalPosition: [number, number][] = [];
  lexicalAnalyzer(sql, lexicalPosition);

  const tokenList: string[] = [];
  const tokenPosition: [number, number][] = [];
  tokenExtractor(sql, lexicalPosition, SqlSyntax.sqlTokenMap, SqlSyntax.sqlSingularTokenMap, tokenList, tokenPosition);

  const statements: Array<Statement> = [];
  let temp: Array<string> = [];
  let starter = 0;
  for (let i = 0; i < tokenList.length; i++) {
    const token = tokenList[i];
    if (token !== ";") {
      temp.push(token);
      continue;
    }

    if (temp.length > 0) {
      const item: Statement = {
        tokens: temp,
        sql: sql.slice(tokenPosition[starter][0], tokenPosition[i][1]),
        fields: []
      };
      statements.push(item);
    }
    temp = [];
    starter = i + 1;
  }

  if (temp.length > 0) {

  }
  console.log(tokenList);
  console.log(tokenPosition);
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
    console.log("inside");
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
      let tokenList;
      let j = 1;
      for (tokenList of sqlTokenMap.get(tokenUpperCase) || []) {
        let nextToken = tokenUpperCase;
        j = 1;
        for (j; j <= tokenList.length - 1; j++) {
          nextToken += " " + sql.slice(lexicalPosition[i + j][0], lexicalPosition[i + j][1]).toUpperCase();
        }
        if (tokenList.join(" ") === nextToken) {
          found = true;
          break;
        }
      }

      if (found && tokenList) {
        tokenList.push(tokenList.join(" "));
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