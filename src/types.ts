import { DB_PROPERTIES } from "./constants.ts";

type PropertyType = keyof typeof DB_PROPERTIES;

export type BookItem = Partial<
  & Record<PropertyType, string | number | null>
  & {
    page_id: string;
  }
>;

export type DoubanBookType = "wish" | "do" | "collect";
export type GoodReadsBookType = "read" | "currently-reading" | "to-read";
