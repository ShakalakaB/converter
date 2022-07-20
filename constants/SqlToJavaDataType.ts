export class SqlToJavaDataType {
  private static _dataTypeMap: Map<string, string> = new Map<string, string>([
    ["CHAR", "String"],
    ["VARCHAR", "String"],
    ["BINARY", "String"],
    ["VARBINARY", "String"],
    ["TINYBLOB", "String"],
    ["TINYTEXT", "String"],
    ["TEXT", "String"],
    ["BLOB", "String"],
    ["MEDIUMTEXT", "String"],
    ["MEDIUMTEXT", "String"],
    ["MEDIUMBLOB", "String"],
    ["LONGTEXT", "String"],
    ["LONGBLOB", "String"],
    ["ENUM", "Enum"],
    ["SET", "Set<String>"],
    ["BIT", "Integer"],
    ["TINYINT", "Integer"],
    ["BOOL", "Boolean"],
    ["BOOLEAN", "Boolean"],
    ["BOOLEAN", "Boolean"],
    ["SMALLINT", "Integer"],
    ["MEDIUMINT", "Integer"],
    ["INT", "Integer"],
    ["INTEGER", "Integer"],
    ["BIGINT", "Integer"],
    ["FLOAT", "Double"],
    ["DOUBLE", "Double"],
    ["DOUBLE PRECISION", "Double"],
    ["DECIMAL", "BigDecimal"],
    ["DEC", "BigDecimal"],
    ["DATE", "LocalDate"],
    ["DATETIME", "LocalDateTime"],
    ["TIMESTAMP", "Timestamp"],
    ["TIME", "Time"],
    ["YEAR", "Year"],
  ]);


  static get dataTypeMap(): Map<string, string> {
    return this._dataTypeMap;
  }
}