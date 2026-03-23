export type PostWithAuthor = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  sighting_location_name: string | null;
  species_tags: string[];
  created_at: string;
  like_count: number;
  user_liked: boolean;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
};
