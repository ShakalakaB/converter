import { FC, PropsWithChildren } from "react";
import { string } from "prop-types";

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
  let position = 0;
  const lexicalPosition: [number, number][] = [];

  while (position < sql.length) {
    // new line, space
    let match: RegExpMatchArray | null = sql.slice(position).match(/^\\s+/);
    if (match) {
      position += match[0].length;
      continue;
    }

    // comment
    if (sql.slice(position).match(/^(--|#)/)) {
      match = sql.slice(position).match(/[\n\r]/);
      if (match == null || match.index == null) {
        throw new Error("Unterminated comment");
      } else {
        position = match.index + match[0].length;
        continue;
      }
    }
    if (sql.slice(position).match(/\/\*/)) {
      match = sql.slice(position).match(/\*\//);
      if (match == null || match.index == null) {
        throw new Error("Unterminated comment");
      } else {
        position = match.index + match[0].length;
        continue;
      }
    }

    // [a-zA-Z0-9_]*
    match = sql.slice(position).match(/[a-zA-Z0-9_]*/);
    if (match&& match.index != undefined) {
      lexicalPosition.push([match.index, match.index + match[0].length]);
      position = match.index + match[0].length;
      continue;
    }

    // backtick quoted field
    if (sql.slice(position, position + 1) == "`") {
      match = sql.slice(position + 1).match("`");
      if (!match || match.index == undefined) {
        throw new Error("Unterminated backtick");
      } else {
        lexicalPosition.push([position, match.index + 1]);
        position = match.index + 1;
        continue;
      }
    }

    // <unsigned numeric literal>
    // <unsigned integer> [ <period> [ <unsigned integer> ] ]
    // <period> <unsigned integer>
    // <unsigned integer> ::= <digit>...
    match = sql.slice(position).match(/(\d+\.?\d*|\.\d+)/);
    if (match && match.index != undefined) {
      lexicalPosition.push([position, position + match[0].length]);
      position = match.index + match[0].length;
      continue;
    }



  }

  return <h2>sqlparser</h2>;
};