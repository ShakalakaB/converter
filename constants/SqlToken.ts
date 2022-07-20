export class SqlToken {
  private static _sqlTokenMap: Map<string, Array<Array<String>>> = new Map();

  private static _sqlSingularTokenMap: Map<string, number> = new Map([
    ["NULL", 1],
    ["CONSTRAINT", 1],
    ["INDEX", 1],
    ["KEY", 1],
    ["UNIQUE", 1],
  ]);

  private static sqlTokens = [
    "FULLTEXT INDEX",
    "FULLTEXT KEY",
    "SPATIAL INDEX",
    "SPATIAL KEY",
    "FOREIGN KEY",
    "USING BTREE",
    "USING HASH",
    "PRIMARY KEY",
    "UNIQUE INDEX",
    "UNIQUE KEY",
    "CREATE TABLE",
    "CREATE TEMPORARY TABLE",
    "DATA DIRECTORY",
    "INDEX DIRECTORY",
    "DEFAULT CHARACTER SET",
    "CHARACTER SET",
    "DEFAULT CHARSET",
    "DEFAULT COLLATE",
    "IF NOT EXISTS",
    "NOT NULL",
    "WITH PARSER",
    "MATCH FULL",
    "MATCH PARTIAL",
    "MATCH SIMPLE",
    "ON DELETE",
    "ON UPDATE",
    "SET NULL",
    "NO ACTION",
    "SET DEFAULT",
    "DOUBLE PRECISION",
    "CHARACTER VARYING",
  ];

  static {
    SqlToken.sqlTokens.forEach(sqlToken => {
      const splitToken = sqlToken.split(" ");
      let items = SqlToken._sqlTokenMap.get(splitToken[0]);
      if (items == undefined) {
        items = [];
      }
      items.push(splitToken);
      SqlToken._sqlTokenMap.set(splitToken[0], items);
    });
  }


  static get sqlTokenMap(): Map<string, Array<Array<String>>> {
    return this._sqlTokenMap;
  }

  static get sqlSingularTokenMap(): Map<string, number> {
    return this._sqlSingularTokenMap;
  }
}