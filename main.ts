import "https://deno.land/std@0.182.0/dotenv/load.ts";
import { Client } from "https://deno.land/x/notion_sdk@v2.2.3/src/mod.ts";
import { parseFeed } from "https://deno.land/x/rss@0.5.8/mod.ts";
import {
  CreatePageParameters,
  PageObjectResponse,
  UpdatePageParameters,
} from "https://deno.land/x/notion_sdk@v2.2.3/src/api-endpoints.ts";
import dayjs from "npm:dayjs@1.11.7";
import {
  DOMParser,
  Node,
  NodeType,
} from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { FeedEntry } from "https://deno.land/x/rss@0.5.8/src/types/feed.ts";

enum DB_PROPERTIES {
  封面 = "封面",
  书名 = "书名",
  个人评分 = "个人评分",
  标注日期 = "标注日期",
  我的短评 = "我的短评",
  条目链接 = "条目链接",
  出版日期 = "出版日期",
  出版社 = "出版社",
  作者 = "作者",
  译者 = "译者",
  ISBN = "ISBN",
  丛书 = "丛书",
  出品方 = "出品方",
  状态 = "状态",
}

const PropertyType: Record<keyof typeof DB_PROPERTIES, string> = {
  封面: "files",
  书名: "title",
  个人评分: "multi_select",
  标注日期: "date",
  我的短评: "rich_text",
  条目链接: "url",
  出版日期: "date",
  出版社: "rich_text",
  作者: "rich_text",
  ISBN: "rich_text",
  状态: "multi_select",
  译者: "rich_text",
  丛书: "rich_text",
  出品方: "rich_text",
};

enum RATING_TEXT {
  很差 = "⭐",
  较差 = "⭐⭐",
  还行 = "⭐⭐⭐",
  推荐 = "⭐⭐⭐⭐",
  力荐 = "⭐⭐⭐⭐⭐",
}

const StatusRegExp = /^想读|(?<=最近)在读|读过/;

enum EMOJI {
  在读 = "📖",
  读过 = "📕",
  想读 = "🔖",
}

const DOUBAN_USER_ID = Deno.env.get("DOUBAN_USER_ID");
const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
const NOTION_BOOK_DATABASE_ID = Deno.env.get("NOTION_BOOK_DATABASE_ID");

type BookItem =
  & Partial<Record<keyof typeof DB_PROPERTIES, string>>
  & {
    page_id?: string;
  };

function getIDFromURL(url?: string): string {
  const [, id] = url?.match(/\/subject\/(\d+)\/?/) || [];
  return id;
}

function getStatusFromTitle(title?: string): string {
  const [status] = title?.match(StatusRegExp) || [""];
  return status;
}

function getNextElementSibling(content: Node) {
  let next = content.nextSibling;
  while (true) {
    if (next?.nodeType !== NodeType.ELEMENT_NODE && next !== null) {
      next = next.nextSibling;
    } else {
      return next;
    }
  }
}

function getNextValidContent(content: Node) {
  const next = content.nextSibling?.textContent?.trim();
  if (next) return content.nextSibling;
  else return getNextElementSibling(content);
}

function parseBookMarkItem(item: FeedEntry): BookItem {
  const data: BookItem = {};

  data[DB_PROPERTIES.状态] = getStatusFromTitle(item.title?.value);
  data[DB_PROPERTIES.标注日期] = dayjs(item.published).format("YYYY-MM-DD");
  data[DB_PROPERTIES.条目链接] = item.links[0].href;

  const dom = new DOMParser().parseFromString(
    item.description?.value || "",
    "text/html",
  );
  const contents = [...dom!.querySelectorAll("td > p")];

  for (const content of contents) {
    const text = content.textContent;
    if (text.startsWith("推荐")) {
      data[DB_PROPERTIES.个人评分] =
        RATING_TEXT[text.replace(/^推荐: /, "") as keyof typeof RATING_TEXT];
      continue;
    }

    if (text.startsWith("备注")) {
      data[DB_PROPERTIES.我的短评] = text.replace(/^备注: /, "");
      continue;
    }
  }

  return data;
}

async function htmlParser(link?: string) {
  if (!link) return;
  const data: BookItem = {};
  const response = await (await fetch(link)).text();
  const dom = new DOMParser().parseFromString(response, "text/html")!;

  data[DB_PROPERTIES.书名] = dom
    .querySelector('#wrapper > h1 > [property="v:itemreviewed"]')
    ?.textContent.trim();
  data[DB_PROPERTIES.封面] = dom
    .querySelector("#mainpic > a")
    ?.getAttribute("href")
    ?.replace(/\.webp$/, ".jpg");

  const infoContents = dom.querySelectorAll("#info .pl");

  for (const content of infoContents) {
    const text = content.textContent.trim();
    const parentNode = content.parentElement;
    if (parentNode?.id !== "info") {
      if (text.startsWith(DB_PROPERTIES.作者)) {
        data[DB_PROPERTIES.作者] = parentNode?.textContent.replace(
          "作者:",
          "",
        ).trim()
          .replace(/\n/g, "").replace(/\s/g, "");
      }

      if (text.startsWith(DB_PROPERTIES.译者)) {
        data[DB_PROPERTIES.译者] = parentNode?.textContent.replace(
          "译者:",
          "",
        ).trim()
          .replace(/\n/g, "").replace(/\s/g, "");
      }
      continue;
    }
    if (text.startsWith(DB_PROPERTIES.出版社)) {
      data[DB_PROPERTIES.出版社] = getNextValidContent(content)?.textContent
        .trim();
      continue;
    }

    if (text.startsWith("副书名")) {
      data[DB_PROPERTIES.书名] += `_${
        getNextValidContent(content)?.textContent.trim()
      }`;
      continue;
    }

    if (text.startsWith("原作名")) {
      data[DB_PROPERTIES.书名] += `_[${
        getNextValidContent(content)?.textContent.trim()
      }]`;
      continue;
    }

    if (text.startsWith("出版年")) {
      let nextText = getNextValidContent(content)?.textContent.trim() || "";
      if (/年|月|日/.test(nextText)) {
        nextText = nextText.replace(/年|月|日/g, "-").slice(0, -1);
      }
      data[DB_PROPERTIES.出版日期] = dayjs(nextText).format(
        "YYYY-MM-DD",
      );
      continue;
    }

    if (text.startsWith(DB_PROPERTIES.ISBN)) {
      data[DB_PROPERTIES.ISBN] = getNextValidContent(content)?.textContent
        .trim();
      continue;
    }

    if (text.startsWith(DB_PROPERTIES.丛书)) {
      data[DB_PROPERTIES.丛书] = getNextValidContent(content)?.textContent
        .trim();
      continue;
    }

    if (text.startsWith("出品方")) {
      data[DB_PROPERTIES.出品方] = getNextValidContent(content)?.textContent
        .trim();
      continue;
    }
  }
  return data;
}

function notionParser(
  item: PageObjectResponse,
): BookItem {
  const data: BookItem = { page_id: item.id };
  const keys = Object.keys(
    item.properties,
  ) as (keyof typeof DB_PROPERTIES)[];

  keys.forEach((key) => {
    data[key] = getProperty(item.properties[key], PropertyType[key]);
  });

  return data;
}

function getProperty(item: any, key: string): any {
  switch (key) {
    case "title":
      return item?.[0]?.text.content || null;
    case "files":
      return item?.[0]?.external.url || null;
    case "date":
      return item.date.start || null;
    case "multi_select":
      return item.multi_select[0]?.name || null;
    case "rich_text":
      return item.rich_text[0]?.text?.content || null;
    case "number":
      return item.number || null;
    case "url":
      return item.url || null;
    default:
      return null;
  }
}

function setProperty(val: any, key: string): any {
  if (val === null || val === undefined) return null;

  switch (key) {
    case "title":
      return {
        title: [
          {
            text: {
              content: val || "",
            },
          },
        ],
      };
    case "files":
      return {
        "files": [{
          "name": val,
          "external": {
            "url": val,
          },
        }],
      };
    case "date":
      return {
        date: {
          start: val,
        },
      };
    case "multi_select":
      return {
        "multi_select": [
          {
            name: val,
          },
        ],
      };
    case "rich_text":
      return {
        "rich_text": [
          {
            type: "text",
            text: {
              content: val || "",
            },
          },
        ],
      };
    case "number":
      return {
        number: Number(val),
      };
    case "url":
      return {
        url: val,
      };

    default:
      return null;
  }
}

function deleteUnusedProperties(properties: any) {
  Object.keys(DB_PROPERTIES).map((key) => {
    if (properties[key] === null) {
      delete properties[key];
    }
  });
}

async function createPage(item: BookItem) {
  const data: any = {
    parent: {
      database_id: NOTION_BOOK_DATABASE_ID,
    },
    icon: {
      type: "emoji",
      emoji: EMOJI[item[DB_PROPERTIES.状态] as keyof typeof EMOJI],
    },
    cover: {
      type: "external",
      external: {
        url: item?.[DB_PROPERTIES.封面],
      },
    },
    properties: {},
  };

  data.properties = Object.fromEntries(
    Object.keys(DB_PROPERTIES).map(
      (
        key,
      ) => [
        key,
        setProperty(
          item[key as keyof typeof DB_PROPERTIES],
          PropertyType[key as keyof typeof DB_PROPERTIES],
        ),
      ],
    ),
  );

  deleteUnusedProperties(data.properties);

  await notion.pages.create(data as CreatePageParameters);
}

async function updatePage(item: BookItem) {
  const data = {
    page_id: item.page_id,
    icon: {
      type: "emoji",
      emoji: EMOJI[item[DB_PROPERTIES.状态] as keyof typeof EMOJI],
    },
    cover: {
      type: "external",
      external: {
        url: item?.[DB_PROPERTIES.封面],
      },
    },
    properties: {},
  };

  data.properties = Object.fromEntries(
    Object.keys(DB_PROPERTIES).map(
      (
        key,
      ) => [
        key,
        setProperty(
          item[key as keyof typeof DB_PROPERTIES],
          PropertyType[key as keyof typeof DB_PROPERTIES],
        ),
      ],
    ),
  );

  deleteUnusedProperties(data.properties);
  await notion.pages.update(data as UpdatePageParameters);
}

const notion = new Client({
  auth: NOTION_TOKEN,
});

const response = await fetch(
  `https://www.douban.com/feed/people/${DOUBAN_USER_ID}/interests`,
);
const xml = await response.text();
const feed = await parseFeed(xml);

const feedsData = feed.entries.filter((item) =>
  /book.douban/.test(item.links[0].href || "")
).map((item) => parseBookMarkItem(item));

if (!feedsData.length) {
  console.log("No Need to Update Datebase");
  Deno.exit(1);
}

if (!NOTION_BOOK_DATABASE_ID) {
  console.log(`No found notion database id`);
  Deno.exit(1);
}

await Promise.all(feedsData.map(async (item) => {
  Object.assign(item, await htmlParser(item[DB_PROPERTIES.条目链接]));
}));

const feedsInDatabase = await notion.databases.query({
  database_id: NOTION_BOOK_DATABASE_ID,
  filter: {
    or: feedsData.map((item) => ({
      property: DB_PROPERTIES.条目链接,
      url: {
        contains: getIDFromURL(item[DB_PROPERTIES.条目链接]) || "",
      },
    })),
  },
}).then((data) => {
  return data.results.map((item) => {
    if (!("properties" in item)) return;
    return notionParser(item);
  });
});

feedsData.forEach((feed) => {
  const originFeed = feedsInDatabase.find((item) => {
    return getIDFromURL(item?.[DB_PROPERTIES.条目链接]) ===
      getIDFromURL(feed?.[DB_PROPERTIES.条目链接]);
  }) || {};

  const updatedFeed = Object.assign({}, originFeed, feed);
  if (updatedFeed.page_id) {
    updatePage(updatedFeed);
  } else {
    createPage(updatedFeed);
  }
});
