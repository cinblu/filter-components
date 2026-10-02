import { ARTICLE_URL, AUTHOR, REPO_URL } from "@/lib/links";

/** Credits: who designed it, and where the thinking comes from. */
export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-1.5 border-t pt-6 text-xs text-pretty text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/30 [&_a]:underline-offset-4 [&_a:hover]:decoration-foreground">
      <p>
        Designed and built by <a href={AUTHOR.linkedin}>{AUTHOR.name}</a>, from the article{" "}
        <a href={ARTICLE_URL}>Crafting a modular filtering framework for data-heavy applications</a>.
      </p>
      <p>
        Open source under the MIT licence · <a href={REPO_URL}>Source on GitHub</a>
      </p>
    </footer>
  );
}
