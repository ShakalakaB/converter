import "../styles/globals.css";
import "bootstrap/dist/css/bootstrap.css";
import "@fontsource/source-code-pro";
import type { AppProps } from "next/app";
import { Layout } from "../components/layout/Layout";
import Head from "next/head";
import { useEffect } from "react";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // @ts-ignore
    import("bootstrap/dist/js/bootstrap");
  }, []);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default MyApp;
