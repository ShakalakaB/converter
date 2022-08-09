import type { NextPage } from "next";
import Script from "next/script";
import Head from "next/head";
import { SqlParser } from "../components/SqlParser";

const Home: NextPage = () => {
  return (
    <>
      {/*Google tag (gtag.js)*/}
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
      />

      <Script id="google-analytics" strategy="lazyOnload">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
              page_path: window.location.pathname,
            });
                `}
      </Script>

      <Head>
        <title>Convertor | Online convertor tools</title>
        {/*<meta name="description" content="Online convertor tools" />*/}
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
          content="Convertor | SQL Table to Entity Class Generator "
        />
        <meta
          name="og.description"
          content="Generate class from database table online, convert a 'CREATE TABLE' script from MS-SQL, ORACLE, MYSQL,POSTGRESQL, SQLite database to class in C#, TypeScript, VB.NET, JAVA, PHP, JavaScript, Python and more programming languages."
        />
        <meta
          name="og.image"
          content="https://convertor.aldoraweb.com/logo.png"
        />
        <meta name="og.url" content="https://convertor.aldoraweb.com" />
        <meta name="og.site_name" content="convertor.aldoraweb.com" />
        <meta name="twitter:url" content="https://convertor.aldoraweb.com" />
        <meta
          name="twitter:image"
          content="https://convertor.aldoraweb.com/logo.png"
        />
        <meta name="twitter:label1" content="Written by" />
        <meta name="twitter:data1" content="1354" />
        <meta name="og:image:width" content="Aldora Lee" />
        <meta name="og:image:height" content="1076" />
      </Head>
      <SqlParser />
    </>
  );
};

export default Home;
