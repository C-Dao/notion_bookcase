import Client from "notion_sdk/client";
import {
  CreatePageParameters,
  PageObjectResponse,
  UpdatePageParameters,
} from "notion_sdk/api_endpoints";
import {
  DB_PROPERTIES,
  EMOJI,
  NOTION_BOOK_DATABASE_ID,
  NOTION_TOKEN,
  PropertyType,
} from "./constants.ts";
import { BookItem } from "./type.ts";

export const notion = new Client({
  auth: NOTION_TOKEN,
});

export function notionParser(
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

export function getProperty(item: any, key: string): any {
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

export function setProperty(val: any, key: string): any {
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

export function deleteUnusedProperties(properties: any) {
  Object.keys(DB_PROPERTIES).map((key) => {
    if (properties[key] === null) {
      delete properties[key];
    }
  });
}

export async function createPage(item: BookItem) {
  const data: any = {
    parent: {
      database_id: NOTION_BOOK_DATABASE_ID,
    },
    icon: {
      type: "emoji",
      emoji: EMOJI[item[DB_PROPERTIES.状态] as keyof typeof EMOJI] || "",
    },
    cover: {
      type: "external",
      external: {
        url: item?.[DB_PROPERTIES.封面] || "",
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

export async function updatePage(item: BookItem) {
  const data = {
    page_id: item.page_id,
    icon: {
      type: "emoji",
      emoji: EMOJI[item[DB_PROPERTIES.状态] as keyof typeof EMOJI] || "",
    },
    cover: {
      type: "external",
      external: {
        url: item?.[DB_PROPERTIES.封面] || "",
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

export async function queryBooks(ids: string[]) {
  const sliceIds = (() => {
    let slice = [];
    let end = 0;
    while (end < ids.length) {
      slice.push(ids.slice(end, 100));
      end += 100;
    }
    return slice;
  })();
  const res = await Promise.all(sliceIds.map((slice) =>
    notion.databases.query({
      database_id: NOTION_BOOK_DATABASE_ID || "",
      filter: {
        or: slice.map((id) => ({
          property: DB_PROPERTIES.条目链接,
          url: {
            contains: id,
          },
        })),
      },
    }).then((data) => {
      return data.results.map((item) => {
        if (!("properties" in item)) return;
        return notionParser(item);
      });
    })
  ));

  return res.flat();
}
