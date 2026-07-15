export interface Manga {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  cover_url: string;
  status: string;
  author: string;
  artist: string;
  genres: string[];
  rating: number;
}

export interface Chapter {
  id: string;
  series_id: string;
  chapter_number: number;
  title: string;
  release_date: string;
  view_count: number;
}

export interface Page {
  id: string;
  chapter_id: string;
  page_number: number;
  image_url: string;
}

export const MOCK_MANGA: Manga[] = [
  {
    id: "1",
    title: "Solo Leveling",
    slug: "solo-leveling",
    synopsis: "In a world where hunters, humans who possess magical abilities, must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival.",
    cover_url: "https://images.unsplash.com/photo-1618519764620-7403abdbdf9c?auto=format&fit=crop&q=80&w=400&h=600",
    status: "Completed",
    author: "Chugong",
    artist: "DUBU (Redice Studio)",
    genres: ["Action", "Adventure", "Fantasy"],
    rating: 4.9,
  },
  {
    id: "2",
    title: "Jujutsu Kaisen",
    slug: "jujutsu-kaisen",
    synopsis: "Yuji Itadori is a boy with tremendous physical strength, though he lives a completely ordinary high school life. One day, to save a classmate who has been attacked by curses, he eats the finger of Ryomen Sukuna, taking the curse into his own soul.",
    cover_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=400&h=600",
    status: "Ongoing",
    author: "Gege Akutami",
    artist: "Gege Akutami",
    genres: ["Action", "Supernatural", "Shounen"],
    rating: 4.8,
  },
  {
    id: "3",
    title: "Chainsaw Man",
    slug: "chainsaw-man",
    synopsis: "Denji is a teenage boy living with a Chainsaw Devil named Pochita. Due to the debt his father left behind, he has been living a rock-bottom life while repaying his debt by harvesting devil corpses with Pochita.",
    cover_url: "https://images.unsplash.com/photo-1621478374422-35206faeddfb?auto=format&fit=crop&q=80&w=400&h=600",
    status: "Ongoing",
    author: "Tatsuki Fujimoto",
    artist: "Tatsuki Fujimoto",
    genres: ["Action", "Horror", "Comedy"],
    rating: 4.7,
  },
  {
    id: "4",
    title: "Spy x Family",
    slug: "spy-x-family",
    synopsis: "A spy on an undercover mission gets married and adopts a child as part of his cover. His wife and daughter have secrets of their own, and all three must strive to keep together.",
    cover_url: "https://images.unsplash.com/photo-1627856013091-fed6e4e07055?auto=format&fit=crop&q=80&w=400&h=600",
    status: "Ongoing",
    author: "Tatsuya Endo",
    artist: "Tatsuya Endo",
    genres: ["Action", "Comedy", "Slice of Life"],
    rating: 4.9,
  },
  {
    id: "5",
    title: "Omniscient Reader's Viewpoint",
    slug: "omniscient-readers-viewpoint",
    synopsis: "Dokja was an average office worker whose sole interest was reading his favorite web novel 'Three Ways to Survive the Apocalypse.' But when the novel suddenly becomes reality, he is the only person who knows how the world will end.",
    cover_url: "https://images.unsplash.com/photo-1614729939124-03290b55c9ce?auto=format&fit=crop&q=80&w=400&h=600",
    status: "Ongoing",
    author: "Sing Shong",
    artist: "Sleepy-C",
    genres: ["Action", "Adventure", "Fantasy"],
    rating: 4.9,
  }
];

export const MOCK_CHAPTERS: Record<string, Chapter[]> = {
  "solo-leveling": Array.from({ length: 15 }, (_, i) => ({
    id: `sl-${i + 1}`,
    series_id: "1",
    chapter_number: 179 - i,
    title: `Chapter ${179 - i}`,
    release_date: new Date(Date.now() - i * 86400000 * 7).toISOString().split('T')[0],
    view_count: Math.floor(Math.random() * 50000) + 10000,
  })),
  "jujutsu-kaisen": Array.from({ length: 10 }, (_, i) => ({
    id: `jk-${i + 1}`,
    series_id: "2",
    chapter_number: 250 - i,
    title: `Chapter ${250 - i}`,
    release_date: new Date(Date.now() - i * 86400000 * 7).toISOString().split('T')[0],
    view_count: Math.floor(Math.random() * 40000) + 10000,
  })),
};

export const MOCK_PAGES: Record<string, Page[]> = {
  // Mock pages for solo leveling chapter 179
  "sl-1": Array.from({ length: 10 }, (_, i) => ({
    id: `p${i + 1}`,
    chapter_id: "sl-1",
    page_number: i + 1,
    image_url: `https://placehold.co/800x1200/1a1a1a/cccccc?text=Page+${i + 1}\nSolo+Leveling+Ch.179`
  }))
};
