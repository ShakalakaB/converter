import React, { FC, FormEvent, useEffect, useState } from "react";
import { NameType } from "../models/SqlModels";
import { SqlSchemaParserUtil } from "../utils/SqlSchemaParserUtil";
import Prism from "prismjs";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/toolbar/prism-toolbar.css";
import "prismjs/themes/prism-solarizedlight.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export const SqlParser: FC = () => {
  const exampleSqlSchema =
    "CREATE TABLE DbName.TableName ( \n" +
    "   id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, \n" +
    "   errcnt INT(10) UNSIGNED NOT NULL DEFAULT '0', \n" +
    "   user_id INT UNSIGNED NOT NULL, \n" +
    "   photo_id INT UNSIGNED NOT NULL, \n" +
    "   place_id INT UNSIGNED NOT NULL, \n" +
    "   next_processing_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \n" +
    "   created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \n" +
    "   PRIMARY KEY (id), \n" +
    "   KEY (place_id, next_processing_time), \n" +
    "   UNIQUE KEY (user_id, place_id, photo_id) \n" +
    "); ";

  const [entityCode, setEntityCode] = useState<string>("");

  useEffect(() => {
    Prism.highlightAll();
  }, [entityCode]);

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
  };

  return (
    <div className="row px-3 px-xl-1 mb-3">
      <form className="col-xl-7" onSubmit={submitHandler}>
        <div className="row">
          <textarea
            style={{
              height: "calc(100vh - 20vh)",
              resize: "none",
              fontFamily: "monospace",
            }}
            className="col-xl-9 border border-5"
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
      <div
        className="col-xl-5 border border-5 p-0"
        style={{
          position: "relative",
          height: "calc(100vh - 20vh)",
          resize: "none",
          fontFamily: "monospace",
        }}
      >
        <button
          type="button"
          className="btn btn-light "
          title="Copy to clipboard"
          style={{
            position: "absolute",
            right: "0.8em",
            top: "0.3em",
            zIndex: 1,
          }}
        >
          <i className="bi bi-clipboard" />
        </button>
        <pre
          className="line-numbers m-0"
          style={{
            height: "calc(100vh - 21vh)",
            resize: "none",
            fontFamily: "monospace",
          }}
        >
          <code
            className="language-javascript"
            dangerouslySetInnerHTML={{ __html: entityCode }}
          />
        </pre>
      </div>
    </div>
  );
};
