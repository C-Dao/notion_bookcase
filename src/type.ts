import { DB_PROPERTIES } from "./constants.ts";

export type BookItem =
  & Partial<Record<keyof typeof DB_PROPERTIES, string>>
  & {
    page_id?: string;
  };

export type BookType = "wish" | "do" | "collect";