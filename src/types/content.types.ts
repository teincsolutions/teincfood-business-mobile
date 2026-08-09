export interface PageSection {
  heading: string;
  body: string;
  order: number;
  type?: "faq";
  category?: string;
}

export interface PageResponse {
  id: string;
  slug: string;
  locale: string;
  title: string;
  sections: PageSection[];
}
