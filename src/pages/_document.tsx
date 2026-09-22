import Document, { Html, Head, Main, NextScript, type DocumentContext, type DocumentInitialProps } from "next/document";
import { SEOElements } from "@/components/SEO";

type RexDocumentProps = DocumentInitialProps & { htmlLang: "tr" | "en" };

export default class RexDocument extends Document<RexDocumentProps> {
  static async getInitialProps(ctx: DocumentContext): Promise<RexDocumentProps> {
    const initialProps = await Document.getInitialProps(ctx);
    const path = ctx.req?.url?.split("?")[0] || "";
    return { ...initialProps, htmlLang: path === "/en" || path.startsWith("/en/") ? "en" : "tr" };
  }

  render() {
    return (
    <Html lang={this.props.htmlLang || "tr"}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <link rel="icon" type="image/png" href="/rex-favicon-rex.png?v=2" />
        <link rel="shortcut icon" type="image/png" href="/rex-favicon-rex.png?v=2" />
        <link rel="apple-touch-icon" href="/rex-favicon-rex.png?v=2" />
        <SEOElements />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
    );
  }
}
