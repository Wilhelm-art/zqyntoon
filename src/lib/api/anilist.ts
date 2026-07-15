/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getAniListCover(title: string): Promise<string | null> {
  const query = `
    query ($search: String) {
      Media(search: $search, type: MANGA) {
        coverImage {
          extraLarge
          large
        }
      }
    }
  `;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { search: title }
      }),
      signal: controller.signal,
      next: { revalidate: 3600 }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const coverImage = json.data?.Media?.coverImage;

    if (coverImage?.extraLarge) return coverImage.extraLarge;
    if (coverImage?.large) return coverImage.large;

    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    return null;
  }
}
