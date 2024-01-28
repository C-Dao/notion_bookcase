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
} from "../constants.ts";
import { BookItem } from "../types.ts";

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
    data[key] = getProperty(item.properties, key);
  });

  return data;
}

export function getProperty(
  item: PageObjectResponse["properties"],
  key: keyof typeof DB_PROPERTIES,
) {
  const property = PropertyType[key];
  const propertyItem = item[key];

  switch (property) {
    case "title":
      if ("title" === propertyItem.type) {
        if (propertyItem?.title?.[0].type === "text") {
          return propertyItem?.title?.[0]?.text?.content || null;
        }
      }
      break;
    case "files":
      if ("files" === propertyItem.type) {
        if (propertyItem?.files?.[0].type === "external") {
          return propertyItem?.files?.[0]?.external.url || null;
        }
      }
      break;
    case "date":
      if ("date" === propertyItem.type) {
        return propertyItem.date?.start || null;
      }
      break;
    case "multi_select":
      if ("multi_select" === propertyItem.type) {
        return propertyItem.multi_select[0]?.name || null;
      }
      break;
    case "rich_text":
      if ("rich_text" === propertyItem.type) {
        if (propertyItem?.rich_text?.[0]?.type === "text") {
          return propertyItem.rich_text[0]?.text?.content || null;
        }
      }
      break;
    case "number":
      if ("number" === propertyItem.type) {
        return propertyItem.number || null;
      }
      break;
    case "url":
      if ("url" === propertyItem.type) {
        return propertyItem.url || null;
      }
      break;
    default:
      return null;
  }
  return null;
}

export function setProperty(
  val: string | null | number | undefined,
  key: string,
) {
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
          "name": typeof val == "string" ? val?.slice(0, 100) : val,
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

export function deleteUnusedProperties(properties: BookItem) {
  Object.keys(DB_PROPERTIES).map((key) => {
    if (properties[key as unknown as DB_PROPERTIES] === null) {
      delete properties[key as unknown as DB_PROPERTIES];
    }
  });
}

export async function createPage(item: BookItem) {
  const data = {
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

export async function queryBooks(
  ids: string[],
  domain: "goodreads" | "douban",
) {
  const validIDs = ids.filter((id) => !!id.trim());
  const sliceIDs = (() => {
    const slice: string[][] = [];
    let end = 0;
    while (end < validIDs.length) {
      slice.push(validIDs.slice(end, 100));
      end += 100;
    }
    return slice;
  })();

  const res = await Promise.all(sliceIDs.map((slice) =>
    notion.databases.query({
      database_id: NOTION_BOOK_DATABASE_ID || "",
      filter: {
        or: slice.map((id) => ({
          and: [
            {
              property: DB_PROPERTIES.条目链接,
              url: {
                contains: domain,
              },
            },
            {
              property: DB_PROPERTIES.条目链接,
              url: {
                contains: id,
              },
            },
          ],
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
