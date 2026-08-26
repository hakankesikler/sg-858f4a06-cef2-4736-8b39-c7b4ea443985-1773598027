import { Html, Head, Main, NextScript } from "next/document";
import { SEOElements } from "@/components/SEO";

export default function Document() {
  return (
    <Html lang="tr">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <link rel="icon" type="image/png" href="/rex-favicon.png?v=1" />
        <link rel="shortcut icon" type="image/png" href="/rex-favicon.png?v=1" />
        <link rel="apple-touch-icon" href="/rex-favicon.png?v=1" />
        <SEOElements />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
