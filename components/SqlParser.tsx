import { FC, FormEvent, PropsWithChildren, useEffect, useState } from "react";
import { func, number, string } from "prop-types";
import { SqlToken } from "../constants/SqlToken";
import { SqlToJavaDataType } from "../constants/SqlToJavaDataType";
import { NameType } from "../models/SqlModels";
import { SqlSchemaParserUtil } from "../utils/SqlSchemaParserUtil";

// https://docs.microsoft.com/en-us/sql/language-extensions/how-to/java-to-sql-data-types?view=sql-server-ver16
// https://www.w3schools.com/sql/sql_datatypes.asp

export const SqlParser: FC = () => {
  const exampleSqlSchema =
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
    "                ); create table";

  const [entityCode, setEntityCode] = useState<string>("");

  let nameType = NameType.CAMEL_CASE;
  let getterAndSetterIncluded = false;

  const submitHandler = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const javaCode = SqlSchemaParserUtil.parseSchema(
      event.currentTarget.sqlSchema?.value,
      nameType,
      getterAndSetterIncluded
    );
    setEntityCode(javaCode);
    console.log(entityCode);
  };

  return (
    <div className="row">
      <form className="col-6" onSubmit={submitHandler}>
        <div className="mb-3">
          <label htmlFor="sqlSchema" className="form-label">
            sql schema
          </label>
          <textarea
            className="form-control"
            rows={20}
            id="sqlSchema"
            aria-describedby="sql-schema-input"
            placeholder="schema"
            defaultValue={exampleSqlSchema}
          />
        </div>

        <button className="btn btn-primary" type="submit">
          Submit
        </button>
      </form>
      <textarea className="col-6" defaultValue={entityCode}></textarea>
    </div>
  );
};
