import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  // Arabic/RTL is the default; LangProvider flips these on the client if the
  // user has previously chosen English.
  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
