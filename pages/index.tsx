import type { NextPage } from "next";
import Head from "next/head";
import { SqlParser } from "../components/SqlParser";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Convertor | Online convertor tools</title>
        <meta name="description" content="Online convertor tools" />
      </Head>
      <SqlParser />
    </>
  );
};

export default Home;
