const currentYear = new Date().getFullYear();

export const Footer = () => (
  <footer className="border-border bg-background text-muted-foreground mt-auto w-full border-t">
    <div className="mx-auto flex w-full max-w-(--app-max-width) flex-col gap-4 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between md:px-6">
      <div className="flex flex-col gap-1 text-left">
        <p>
          Website by{" "}
          <a
            href="https://github.com/ByCesarDev"
            target="_blank"
            rel="noopener"
            className="text-primary underline underline-offset-2"
          >
            ByCesarDev
          </a>{" "}
          ·{" "}
          <a
            href="https://youtube.com/@ByCesarDev"
            target="_blank"
            rel="noopener"
            className="text-primary underline underline-offset-2"
          >
            YouTube
          </a>{" "}
          ·{" "}
          <a
            href="https://github.com/ByCesarDev/Crafting"
            target="_blank"
            rel="noopener"
            className="text-primary underline underline-offset-2"
          >
            GitHub
          </a>
        </p>
        <p>
          Support me on{" "}
          <a
            href="https://ko-fi.com/bycesarkun"
            target="_blank"
            rel="noopener"
            className="text-primary underline underline-offset-2"
          >
            Ko-Fi
          </a>
        </p>
      </div>

      <div className="flex flex-col gap-1 text-left sm:text-right">
        <p>The Minecraft item icons are copyright © 2009-{currentYear} Mojang Studios</p>
        <p>This website is not affiliated with Mojang Studios or Microsoft</p>
      </div>
    </div>
  </footer>
);
