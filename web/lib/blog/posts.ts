// Blog posts. Empty on purpose -- nothing has been published yet, and the
// index page below is written to render an honest empty state rather than
// fabricated posts (unlike the grants page's demo cohort, a fake blog post
// would read as real authored writing, not illustrative example data).
//
// Add real posts here when they exist. slug becomes the URL
// (/blog/[slug]) once a post-detail route is built -- not needed yet with
// zero posts.
export interface BlogPost {
  slug: string;
  title: string;
  publishedAt: string; // ISO date
  excerpt: string;
}

export const POSTS: BlogPost[] = [];
