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
        <meta name="description" content="Online convertor tools" />
      </Head>
      <SqlParser />
    </>
  );
};

export default Home;
