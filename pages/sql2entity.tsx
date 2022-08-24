import Head from "next/head";
import { SqlParser } from "../components/SqlParser";

const sql2entity = () => (
  <>
    <Head>
      <title>SchemaConvertor | SQL Table to Java Class</title>
      <meta name="description" content="Convert sql schema to java class" />
    </Head>
    <SqlParser />
  </>
);

export default sql2entity;
