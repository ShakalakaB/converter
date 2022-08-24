import Head from "next/head";
import { SqlParser } from "../components/SqlParser";

const sql2entity = () => (
  <>
    <Head>
      <title>SchemaConvertor | SQL Table to Java Class</title>
      <meta
        name="description"
        content="Generate class from database table online, convert a 'CREATE TABLE' script from MS-SQL, ORACLE, MYSQL,POSTGRESQL, SQLite database to class in C#, TypeScript, VB.NET, JAVA, PHP, JavaScript, Python and more programming languages."
      />
      <meta
        name="keywords"
        content="sql table to class, SQL Entity Class Generator, sql table to c# class, sql table to javascript class, sql table to python class, sql table to java class sql table to vb.net class, online class generator from sql server,postgresql to class"
      />
      <meta
        name="og:title"
        content="Converter | SQL Table to Entity Class Generator "
      />
      <meta
        name="og.description"
        content="Generate class from database table online, convert a 'CREATE TABLE' script from MS-SQL, ORACLE, MYSQL,POSTGRESQL, SQLite database to class in C#, TypeScript, VB.NET, JAVA, PHP, JavaScript, Python and more programming languages."
      />
      <meta
        name="og.image"
        content="https://converter.aldoraweb.com/logo.png"
      />
      <meta name="og.url" content="https://converter.aldoraweb.com" />
      <meta name="og.site_name" content="converter.aldoraweb.com" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Online SQL Table to Entity Class Generator"
      />
      <meta
        name="twitter:description"
        content="Generate class from database table online, convert a 'CREATE TABLE' script from MS-SQL, ORACLE, MYSQL,POSTGRESQL, SQLite database to class in C#, TypeScript, VB.NET, JAVA, PHP, JavaScript, Python and more programming languages."
      />
      <meta name="twitter:url" content="https://converter.aldoraweb.com" />
      <meta
        name="twitter:image"
        content="https://converter.aldoraweb.com/logo.png"
      />
      <meta name="twitter:label1" content="Written by" />
      <meta name="twitter:data1" content="1354" />
      <meta name="og:image:width" content="Aldora Lee" />
      <meta name="og:image:height" content="1076" />
    </Head>
    <SqlParser />
  </>
);

export default sql2entity;
