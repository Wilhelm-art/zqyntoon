import { searchManga, getComicDetail, getChapterPages } from '../../src/lib/scraper/bacakomik.ts';

async function testOnePiece() {
  console.log('Testing One Piece flow...');
  const search = await searchManga('One Piece');
  console.log('Found:', search.length, 'Top:', search[0].title, search[0].slug);
  const detail = await getComicDetail(search[0].slug);
  console.log('One Piece Chapters:', detail.chapters.length);
  const firstCh = detail.chapters[detail.chapters.length - 1];
  console.log('First Ch:', firstCh.title, firstCh.id);
  const pages = await getChapterPages(firstCh.id);
  console.log('Pages count for first chapter:', pages.length, 'Sample:', pages[0]);
}

testOnePiece().catch(console.error);
