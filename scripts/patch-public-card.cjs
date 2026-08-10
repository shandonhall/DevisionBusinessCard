const fs = require("fs");
const path = "src/lib/cards/public-card.ts";
let content = fs.readFileSync(path, "utf8");

if (!content.includes("resolveBrandDNA")) {
  content = content.replace(
    'import type { BrandKit, CardLayoutId, Json } from "@/types/database";',
    'import { resolveBrandDNA } from "@/lib/experience/resolve";\nimport type { BrandKit, CardLayoutId, Json } from "@/types/database";',
  );
}

if (!content.includes("brandDNA:")) {
  content = content.replace(
    `    tokens: {
      ...tokens,
      logoUrl,
      layoutId,
    },
  };
}`,
    `    tokens: {
      ...tokens,
      logoUrl,
      layoutId,
    },
    brandDNA: resolveBrandDNA({
      tokens: {
        ...tokens,
        logoUrl,
        layoutId,
      },
      organisationKit: payload.organisation_kit,
      brandKit: payload.brand_kit,
      cardKit: payload.card_kit,
    }),
  };
}`,
  );
}

fs.writeFileSync(path, content);
console.log("ok", content.includes("brandDNA:"), content.includes("resolveBrandDNA"));
