export interface PageSection {
  heading: string;
  body: string;
  order: number;
  type?: "faq" | "support";
  category?: string;
  email?: string;
  phone?: string;
  hours?: string;
  chat?: boolean | string;
}

export interface PageResponse {
  id: string;
  slug: string;
  locale: string;
  audience: string;
  title: string;
  meta_description?: string | null;
  sections: PageSection[];
}
