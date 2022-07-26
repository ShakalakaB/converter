import { FC, FormEvent, useState } from "react";
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

  const submitHandler = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const nameType = event.currentTarget.nameType?.value;
    const getterAndSetterIncluded =
      event.currentTarget.getterAndSetter?.checked;
    const javaCode = SqlSchemaParserUtil.parseSchema(
      event.currentTarget.sqlSchema?.value,
      NameType[nameType as keyof typeof NameType],
      getterAndSetterIncluded
    );
    setEntityCode(javaCode);
    console.log(entityCode);
  };

  return (
    <div className="row px-3 px-xl-1 mb-3">
      <form className="col-xl-7" onSubmit={submitHandler}>
        <div className="row">
          <textarea
            // style={{ height: "27rem" }}
            style={{
              height: "calc(100vh - 20vh)",
              resize: "none",
              fontFamily: "monospace",
            }}
            className="col-xl-9 border border-5"
            // rows={20}
            id="sqlSchema"
            aria-describedby="sql-schema-input"
            defaultValue={exampleSqlSchema}
          />
          <div className="col-xl-3 my-3" id="convertorConfig">
            <div className="form-check mb-3">
              <label
                className="form-check-label"
                htmlFor="getterAndSetterInput"
              >
                Getters and Setters
              </label>
              <input
                className="form-check-input"
                type="checkbox"
                name="getterAndSetter"
                id="getterAndSetterInput"
              />
            </div>
            <div className="form-check">
              <label className="form-check-label" htmlFor="camelcaseInput">
                Camel Case
              </label>
              <input
                className="form-check-input"
                type="radio"
                name="nameType"
                // value="camelCase"
                value={NameType[NameType.CAMEL_CASE]}
                id="camelcaseInput"
                checked
              />
            </div>
            <div className="form-check mb-3">
              <label className="form-check-label" htmlFor="underscoreInput">
                Underscore
              </label>
              <input
                className="form-check-input"
                type="radio"
                name="nameType"
                // value="underscore"
                value={NameType[NameType.UNDERSCORE]}
                id="underscoreInput"
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Submit
            </button>
          </div>
        </div>
      </form>
      <textarea
        className="col-xl-5 border border-5"
        defaultValue={entityCode}
        style={{
          height: "calc(100vh - 20vh)",
          resize: "none",
          fontFamily: "monospace",
        }}
      />
    </div>
  );
};
