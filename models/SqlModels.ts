export class SqlField {
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

export type Statement = {
  tokens: Array<string>;
  sql: string;
  pointer: number;
};

export type Table = {
  tableName: string;
  fields: Array<SqlField>;
  sql: string;
};

export enum NameType {
  CAMEL_CASE,
  UPPER_CAMEL_CASE,
  UNDERSCORE,
}
