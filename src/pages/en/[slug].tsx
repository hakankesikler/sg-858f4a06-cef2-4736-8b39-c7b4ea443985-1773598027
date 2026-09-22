import type { GetStaticPaths, GetStaticProps } from "next";
import { EnglishPublicPage } from "@/components/EnglishPublicPage";
import { englishPublicPages, englishServiceSlugs, type EnglishPublicPage as Page } from "@/content/english-public-pages";

export default function EnglishServiceRoute({ page }: { page: Page }) { return <EnglishPublicPage page={page} />; }

export const getStaticPaths: GetStaticPaths = async () => ({ paths: englishServiceSlugs.map((slug) => ({ params: { slug } })), fallback: false });
export const getStaticProps: GetStaticProps<{ page: Page }> = async ({ params }) => {
  const slug = String(params?.slug || ""); const page = englishPublicPages[slug];
  return page ? { props: { page } } : { notFound: true };
};
