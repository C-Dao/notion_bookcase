import "dotenv/load";
import dayjs from "npm:dayjs@1.11.7";
import { parseFeed } from "rss";
import { DOMParser } from "deno_dom";
import { FeedEntry } from "rss/feed";
import { htmlParser } from "./book_fetch.ts";
import { createPage, queryBooks, updatePage } from "./notion_api.ts";
import { DB_PROPERTIES,RATING_TEXT,DOUBAN_USER_ID,NOTION_BOOK_DATABASE_ID } from "./constants.ts";
import { BookItem } from "./type.ts";
import { getIDFromURL } from "./utils.ts";

function getStatusFromTitle(title?: string): string {
  const [status] = title?.match(/^想读|(?<=最近)在读|读过/) || [""];
  return status;
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

const feedsInDatabase = await queryBooks(
  feedsData.map((feed) => getIDFromURL(feed[DB_PROPERTIES.条目链接]) || ""),
);

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
