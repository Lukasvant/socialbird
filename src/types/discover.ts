export type DiscoverUser = {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  location_name: string | null;
  interests: string[];
  follower_count: number;
  distance_meters: number | null;
  is_following: boolean;
};
