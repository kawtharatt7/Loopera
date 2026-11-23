# Third-party components

Copied from 21st.dev. Both are MIT licensed. One change: `sneaker-product-hero.tsx` takes an
optional `word` prop (the brand word shown behind the product instead of the colour name).

| File | Component | Author | Source |
| --- | --- | --- | --- |
| `product-rail-gallery.tsx` | Product Rail Gallery – Fashion Store Hero Section (`ClothingRailHero`) | DHxWhy | https://21st.dev/@dhxwhy/components/product-rail-gallery |
| `sneaker-product-hero.tsx` | Sneaker Product Page Hero (`SneakerProductHero`) | Kedhareswer Naidu | https://21st.dev/@kedhareswer/components/sneaker-product-hero |

They are themed through the semantic tokens in `src/app/globals.css` (`--color-foreground`,
`--color-background`, `--color-muted-foreground`) and the shadcn color names in `tailwind.config.ts`.
Crochet wording and photo framing are applied from the outside (props and the `.loopera-piece`
wrapper styles), so the files themselves stay as published.
